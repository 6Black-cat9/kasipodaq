import { Router, type Request, type Response } from 'express';
import { Prisma } from '@prisma/client';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '../utils/prisma.js';
import { asyncHandler, HttpError, success } from '../utils/http.js';
import { pagination } from '../utils/pagination.js';
import { lockUserAdministration } from '../utils/admin-lock.js';
import { optionalAuth, requireAuth, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validation.js';
import {
  documentSchema,
  eventSchema,
  newsSchema,
  settingsSchema,
  userUpdateSchema,
} from '../validators/content.js';
import {
  cleanupUpload,
  isSafeFilename,
  persistUpload,
  storage,
  upload,
} from '../services/upload.js';
import { overviewCounts, statisticsDays, statisticsOverview } from '../services/statistics.js';

export const newsRouter = Router();
export const documentsRouter = Router();
export const eventsRouter = Router();
export const statisticsRouter = Router();
export const notificationsRouter = Router();
export const usersRouter = Router();
export const settingsRouter = Router();
export const publicRouter = Router();
export const uploadsRouter = Router();
export const assetsRouter = Router();

const authorSelect = {
  id: true,
  role: true,
  member: { select: { firstName: true, lastName: true } },
} as const;
const userSelect = {
  id: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  member: true,
} as const;
const staff = (req: Request) => req.user?.role === 'ADMIN' || req.user?.role === 'CHAIRMAN';

function filterEnum<T extends string>(value: unknown, values: readonly T[]): T | undefined {
  if (value === undefined || value === '') return undefined;
  if (typeof value !== 'string' || !values.includes(value as T))
    throw new HttpError(400, 'Сүзгі мәні жарамсыз');
  return value as T;
}

async function assertImageReference(image: string | null | undefined) {
  if (!image) return;
  const filename = image.split('/').at(-1) ?? '';
  const imagePath = image.startsWith('/api/assets/')
    ? path.join(path.dirname(storage.resolve('reference.png')), 'public', filename)
    : storage.resolve(filename);
  try {
    if (!(await stat(imagePath)).isFile()) throw new Error('Not file');
  } catch {
    throw new HttpError(400, 'Сурет табылмады. Алдымен суретті жүктеңіз');
  }
}

function slugify(title: string) {
  const slug = title
    .toLocaleLowerCase('kk-KZ')
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 200);
  return slug.length >= 3 ? slug : `news-${Date.now()}`;
}

newsRouter.use(optionalAuth);
newsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, pageSize, skip, take, q } = pagination(req.query);
    const status = filterEnum(req.query.status, ['DRAFT', 'PUBLISHED'] as const);
    if (!staff(req) && status === 'DRAFT') throw new HttpError(403, 'Бұл бөлімге рұқсатыңыз жоқ');
    const where: Prisma.NewsWhereInput = {
      ...(staff(req)
        ? status
          ? { status }
          : {}
        : { status: 'PUBLISHED', publishedAt: { lte: new Date() } }),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { shortDescription: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [items, total] = await prisma.$transaction([
      prisma.news.findMany({
        where,
        skip,
        take,
        orderBy: [{ publishedAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
        include: { author: { select: authorSelect } },
      }),
      prisma.news.count({ where }),
    ]);
    success(res, { items, total, page, pageSize });
  }),
);
newsRouter.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const news = await prisma.news.findUnique({
      where: { slug: req.params.slug },
      include: { author: { select: authorSelect } },
    });
    if (
      !news ||
      (!staff(req) &&
        (news.status !== 'PUBLISHED' || !news.publishedAt || news.publishedAt > new Date()))
    )
      throw new HttpError(404, 'Жаңалық табылмады');
    success(res, news);
  }),
);
newsRouter.post(
  '/',
  requireAuth,
  requireRole('ADMIN', 'CHAIRMAN'),
  validateBody(newsSchema),
  asyncHandler(async (req, res) => {
    const { notify, ...data } = newsSchema.parse(req.body);
    await assertImageReference(data.image);
    const news = await prisma.$transaction(async (tx) => {
      const created = await tx.news.create({
        data: {
          ...data,
          slug: data.slug ?? slugify(data.title),
          authorId: req.user!.id,
          publishedAt:
            data.status === 'PUBLISHED' ? new Date(data.publishedAt ?? new Date()) : null,
        },
        include: { author: { select: authorSelect } },
      });
      if (
        notify &&
        created.status === 'PUBLISHED' &&
        created.publishedAt &&
        created.publishedAt <= new Date()
      ) {
        const users = await tx.user.findMany({ where: { isActive: true }, select: { id: true } });
        if (users.length)
          await tx.notification.createMany({
            data: users.map((user) => ({
              userId: user.id,
              title: 'Жаңа жаңалық жарияланды',
              message: created.title,
              type: 'NEWS',
              link: `/news/${created.slug}`,
            })),
          });
      }
      return created;
    });
    success(res, news, 'Жаңалық қосылды', 201);
  }),
);
newsRouter.put(
  '/:id',
  requireAuth,
  requireRole('ADMIN', 'CHAIRMAN'),
  validateBody(newsSchema),
  asyncHandler(async (req, res) => {
    const old = await prisma.news.findUnique({ where: { id: req.params.id } });
    if (!old) throw new HttpError(404, 'Жаңалық табылмады');
    const { notify, ...data } = newsSchema.parse(req.body);
    await assertImageReference(data.image);
    const news = await prisma.$transaction(async (tx) => {
      const updated = await tx.news.update({
        where: { id: old.id },
        data: {
          ...data,
          slug: data.slug ?? old.slug,
          publishedAt:
            data.status === 'PUBLISHED'
              ? new Date(data.publishedAt ?? old.publishedAt ?? new Date())
              : null,
        },
        include: { author: { select: authorSelect } },
      });
      if (
        notify &&
        old.status !== 'PUBLISHED' &&
        updated.status === 'PUBLISHED' &&
        updated.publishedAt &&
        updated.publishedAt <= new Date()
      ) {
        const users = await tx.user.findMany({ where: { isActive: true }, select: { id: true } });
        if (users.length)
          await tx.notification.createMany({
            data: users.map((user) => ({
              userId: user.id,
              title: 'Жаңа жаңалық жарияланды',
              message: updated.title,
              type: 'NEWS',
              link: `/news/${updated.slug}`,
            })),
          });
      }
      return updated;
    });
    success(res, news, 'Жаңалық жаңартылды');
  }),
);
newsRouter.delete(
  '/:id',
  requireAuth,
  requireRole('ADMIN', 'CHAIRMAN'),
  asyncHandler(async (req, res) => {
    await prisma.news.delete({ where: { id: req.params.id } });
    success(res, null, 'Жаңалық жойылды');
  }),
);

async function sendStoredFile(
  req: Request,
  res: Response,
  filename: string,
  fileType: string,
  originalName: string,
) {
  const filePath = storage.resolve(filename);
  try {
    if (!(await stat(filePath)).isFile()) throw new Error('Not file');
  } catch {
    throw new HttpError(404, 'Файл табылмады');
  }
  const disposition =
    req.query.download === '1' || !['application/pdf', 'image/jpeg', 'image/png'].includes(fileType)
      ? 'attachment'
      : 'inline';
  res.setHeader('Content-Type', fileType);
  res.setHeader(
    'Content-Disposition',
    `${disposition}; filename*=UTF-8''${encodeURIComponent(originalName)}`,
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "sandbox; default-src 'none'");
  res.setHeader('Cache-Control', 'private, no-store');
  await new Promise<void>((resolve, reject) =>
    res.sendFile(filePath, (error) => (error ? reject(error) : resolve())),
  );
}

documentsRouter.use(optionalAuth);
documentsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, pageSize, skip, take, q } = pagination(req.query);
    const category = filterEnum(req.query.category, [
      'RULES',
      'RESOLUTIONS',
      'PROTOCOLS',
      'ORDERS',
      'REPORTS',
      'REGULATIONS',
      'OTHER',
    ] as const);
    const where: Prisma.DocumentWhereInput = {
      ...(category ? { category } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [items, total] = await prisma.$transaction([
      prisma.document.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { uploader: { select: authorSelect } },
      }),
      prisma.document.count({ where }),
    ]);
    success(res, { items, total, page, pageSize });
  }),
);
documentsRouter.get(
  '/:id/file',
  asyncHandler(async (req, res) => {
    const document = await prisma.document.findUnique({ where: { id: req.params.id } });
    if (!document) throw new HttpError(404, 'Құжат табылмады');
    const filename = document.fileUrl.startsWith('/api/uploads/')
      ? document.fileUrl.slice('/api/uploads/'.length)
      : document.fileName;
    await sendStoredFile(req, res, filename, document.fileType, document.fileName);
  }),
);
documentsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const document = await prisma.document.findUnique({
      where: { id: req.params.id },
      include: { uploader: { select: authorSelect } },
    });
    if (!document) throw new HttpError(404, 'Құжат табылмады');
    success(res, document);
  }),
);
documentsRouter.post(
  '/',
  requireAuth,
  requireRole('ADMIN'),
  upload.single('file'),
  validateBody(documentSchema),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new HttpError(400, 'Файлды тіркеңіз');
    const file = await persistUpload(req.file);
    try {
      const document = await prisma.document.create({
        data: { ...documentSchema.parse(req.body), ...file, uploadedBy: req.user!.id },
      });
      success(res, document, 'Құжат жүктелді', 201);
    } catch (error) {
      await cleanupUpload(file.fileUrl);
      throw error;
    }
  }),
);
documentsRouter.put(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  upload.single('file'),
  validateBody(documentSchema),
  asyncHandler(async (req, res) => {
    const old = await prisma.document.findUnique({ where: { id: req.params.id } });
    if (!old) throw new HttpError(404, 'Құжат табылмады');
    const file = req.file ? await persistUpload(req.file) : null;
    let document;
    try {
      document = await prisma.document.update({
        where: { id: old.id },
        data: { ...documentSchema.parse(req.body), ...(file ?? {}) },
      });
    } catch (error) {
      if (file) await cleanupUpload(file.fileUrl);
      throw error;
    }
    if (file) {
      try {
        await cleanupUpload(old.fileUrl);
      } catch {
        console.error('Replaced document file could not be removed');
      }
    }
    success(res, document, 'Құжат жаңартылды');
  }),
);
documentsRouter.delete(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const document = await prisma.document.delete({ where: { id: req.params.id } });
    try {
      await cleanupUpload(document.fileUrl);
    } catch {
      console.error('Deleted document file could not be removed');
    }
    success(res, null, 'Құжат жойылды');
  }),
);

const eventInclude = (req: Request) =>
  ({
    _count: { select: { participants: true } },
    participants: { where: { userId: req.user?.id ?? '__anonymous__' }, select: { id: true } },
  }) as const;
function eventView<T extends { participants: { id: string }[]; _count: { participants: number } }>(
  event: T,
) {
  return {
    ...event,
    participants: event._count.participants,
    isParticipating: event.participants.length > 0,
  };
}

eventsRouter.use(optionalAuth);
eventsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, pageSize, skip, take, q } = pagination(req.query);
    const status = filterEnum(req.query.status, ['UPCOMING', 'PAST', 'CANCELLED'] as const);
    const where: Prisma.EventWhereInput = {
      ...(status === 'UPCOMING'
        ? { status: 'UPCOMING', date: { gte: new Date(new Date().toISOString().slice(0, 10)) } }
        : {}),
      ...(status === 'PAST'
        ? {
            OR: [
              { status: 'PAST' },
              { status: 'UPCOMING', date: { lt: new Date(new Date().toISOString().slice(0, 10)) } },
            ],
          }
        : {}),
      ...(status === 'CANCELLED' ? { status: 'CANCELLED' } : {}),
      ...(q
        ? {
            AND: {
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { location: { contains: q, mode: 'insensitive' } },
              ],
            },
          }
        : {}),
    };
    const [items, total] = await prisma.$transaction([
      prisma.event.findMany({
        where,
        skip,
        take,
        orderBy: { date: status === 'PAST' ? 'desc' : 'asc' },
        include: eventInclude(req),
      }),
      prisma.event.count({ where }),
    ]);
    success(res, { items: items.map(eventView), total, page, pageSize });
  }),
);
eventsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: eventInclude(req),
    });
    if (!event) throw new HttpError(404, 'Іс-шара табылмады');
    success(res, eventView(event));
  }),
);
eventsRouter.post(
  '/',
  requireAuth,
  requireRole('ADMIN', 'CHAIRMAN'),
  validateBody(eventSchema),
  asyncHandler(async (req, res) => {
    const data = eventSchema.parse(req.body);
    await assertImageReference(data.image);
    const event = await prisma.event.create({
      data: { ...data, date: new Date(data.date) },
      include: eventInclude(req),
    });
    success(res, eventView(event), 'Іс-шара қосылды', 201);
  }),
);
eventsRouter.put(
  '/:id',
  requireAuth,
  requireRole('ADMIN', 'CHAIRMAN'),
  validateBody(eventSchema),
  asyncHandler(async (req, res) => {
    const data = eventSchema.parse(req.body);
    await assertImageReference(data.image);
    const event = await prisma.event.update({
      where: { id: req.params.id },
      data: { ...data, date: new Date(data.date) },
      include: eventInclude(req),
    });
    success(res, eventView(event), 'Іс-шара жаңартылды');
  }),
);
eventsRouter.delete(
  '/:id',
  requireAuth,
  requireRole('ADMIN', 'CHAIRMAN'),
  asyncHandler(async (req, res) => {
    await prisma.event.delete({ where: { id: req.params.id } });
    success(res, null, 'Іс-шара жойылды');
  }),
);
eventsRouter.post(
  '/:id/participate',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!req.user!.member || req.user!.member.status !== 'ACTIVE')
      throw new HttpError(403, 'Белсенді кәсіподақ мүшесі ғана тіркеле алады');
    const event = await prisma.event.findUnique({ where: { id: req.params.id } });
    if (!event) throw new HttpError(404, 'Іс-шара табылмады');
    const today = new Date(new Date().toISOString().slice(0, 10));
    if (event.status !== 'UPCOMING' || event.date < today)
      throw new HttpError(409, 'Іс-шараға тіркелу аяқталды');
    await prisma.eventParticipant.upsert({
      where: { eventId_userId: { eventId: event.id, userId: req.user!.id } },
      create: { eventId: event.id, userId: req.user!.id },
      update: {},
    });
    const updated = await prisma.event.findUniqueOrThrow({
      where: { id: event.id },
      include: eventInclude(req),
    });
    success(res, eventView(updated), 'Іс-шараға тіркелдіңіз');
  }),
);
eventsRouter.delete(
  '/:id/participate',
  requireAuth,
  asyncHandler(async (req, res) => {
    const event = await prisma.event.findUnique({ where: { id: req.params.id } });
    if (!event) throw new HttpError(404, 'Іс-шара табылмады');
    await prisma.eventParticipant.deleteMany({
      where: { eventId: event.id, userId: req.user!.id },
    });
    const updated = await prisma.event.findUniqueOrThrow({
      where: { id: event.id },
      include: eventInclude(req),
    });
    success(res, eventView(updated), 'Тіркелу тоқтатылды');
  }),
);

statisticsRouter.use(requireAuth, requireRole('ADMIN', 'CHAIRMAN'));
statisticsRouter.get(
  '/overview',
  asyncHandler(async (req, res) =>
    success(res, await statisticsOverview(statisticsDays(req.query.days))),
  ),
);
statisticsRouter.get(
  '/members',
  asyncHandler(async (req, res) => {
    const { memberTrend } = await statisticsOverview(statisticsDays(req.query.days));
    success(res, { memberTrend });
  }),
);
statisticsRouter.get(
  '/applications',
  asyncHandler(async (req, res) => {
    const { applicationTrend, applicationTypes, applicationStatuses } = await statisticsOverview(
      statisticsDays(req.query.days),
    );
    success(res, { applicationTrend, applicationTypes, applicationStatuses });
  }),
);
statisticsRouter.get(
  '/events',
  asyncHandler(async (req, res) => {
    const { eventTrend } = await statisticsOverview(statisticsDays(req.query.days));
    success(res, { eventTrend });
  }),
);
publicRouter.get(
  '/overview',
  asyncHandler(async (_req, res) => success(res, await overviewCounts(true))),
);

notificationsRouter.use(requireAuth);
notificationsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, pageSize, skip, take } = pagination(req.query);
    const where = { userId: req.user!.id };
    const [items, total, unreadCount] = await prisma.$transaction([
      prisma.notification.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { ...where, isRead: false } }),
    ]);
    success(res, { items, total, page, pageSize, unreadCount });
  }),
);
notificationsRouter.put(
  '/read-all',
  asyncHandler(async (req, res) => {
    const result = await prisma.notification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true },
    });
    success(res, { count: result.count }, 'Барлық хабарлама оқылды');
  }),
);
notificationsRouter.put(
  '/:id/read',
  asyncHandler(async (req, res) => {
    const result = await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user!.id },
      data: { isRead: true },
    });
    if (!result.count) throw new HttpError(404, 'Хабарлама табылмады');
    success(
      res,
      await prisma.notification.findUnique({ where: { id: req.params.id } }),
      'Хабарлама оқылды',
    );
  }),
);

usersRouter.use(requireAuth, requireRole('ADMIN'));
usersRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, pageSize, skip, take, q } = pagination(req.query);
    const role = filterEnum(req.query.role, ['ADMIN', 'CHAIRMAN', 'MEMBER'] as const);
    const where: Prisma.UserWhereInput = {
      ...(role ? { role } : {}),
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: 'insensitive' } },
              { member: { firstName: { contains: q, mode: 'insensitive' } } },
              { member: { lastName: { contains: q, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };
    const [items, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: userSelect,
      }),
      prisma.user.count({ where }),
    ]);
    success(res, { items, total, page, pageSize });
  }),
);
usersRouter.put(
  '/:id',
  validateBody(userUpdateSchema),
  asyncHandler(async (req, res) => {
    const data = userUpdateSchema.parse(req.body);
    if (
      req.params.id === req.user!.id &&
      (data.isActive === false || (data.role && data.role !== req.user!.role))
    ) {
      throw new HttpError(
        409,
        'Өз рөліңізді өзгертуге немесе өз аккаунтыңызды бұғаттауға болмайды',
      );
    }
    const user = await prisma.$transaction(async (tx) => {
      await lockUserAdministration(tx, req.user!.id);
      const old = await tx.user.findUnique({
        where: { id: req.params.id },
        include: { member: { select: { id: true } } },
      });
      if (!old) throw new HttpError(404, 'Қолданушы табылмады');
      if (
        old.role === 'ADMIN' &&
        old.isActive &&
        (data.isActive === false || (data.role && data.role !== 'ADMIN'))
      ) {
        if ((await tx.user.count({ where: { role: 'ADMIN', isActive: true } })) <= 1)
          throw new HttpError(409, 'Жүйеде кемінде бір белсенді әкімші болуы керек');
      }
      if (data.role === 'MEMBER' && !old.member)
        throw new HttpError(400, 'Алдымен қолданушының мүше профилін жасаңыз');
      const permissionsChanged =
        (data.role !== undefined && data.role !== old.role) ||
        (data.isActive !== undefined && data.isActive !== old.isActive);
      return tx.user.update({
        where: { id: old.id },
        data: {
          ...data,
          ...(permissionsChanged ? { tokenVersion: { increment: 1 } } : {}),
          ...(data.isActive === false && old.member
            ? { member: { update: { status: 'INACTIVE' } } }
            : {}),
        },
        select: userSelect,
      });
    });
    success(res, user, 'Қолданушы жаңартылды');
  }),
);

const settingKeys = [
  'organizationName',
  'schoolName',
  'description',
  'email',
  'phone',
  'address',
  'heroImage',
] as const;
settingsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const settings = await prisma.setting.findMany({ where: { key: { in: [...settingKeys] } } });
    success(res, Object.fromEntries(settings.map((setting) => [setting.key, setting.value])));
  }),
);
settingsRouter.put(
  '/',
  requireAuth,
  requireRole('ADMIN'),
  validateBody(settingsSchema),
  asyncHandler(async (req, res) => {
    const data = settingsSchema.parse(req.body);
    await prisma.$transaction(
      Object.entries(data).map(([key, value]) =>
        prisma.setting.upsert({ where: { key }, create: { key, value }, update: { value } }),
      ),
    );
    success(res, data, 'Жүйе баптаулары сақталды');
  }),
);

uploadsRouter.post(
  '/',
  requireAuth,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new HttpError(400, 'Суретті таңдаңыз');
    success(
      res,
      await persistUpload(req.file, { imagesOnly: true, ownerId: req.user!.id }),
      'Сурет жүктелді',
      201,
    );
  }),
);
uploadsRouter.get(
  '/:filename',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const filename = req.params.filename;
    if (!isSafeFilename(filename)) throw new HttpError(404, 'Файл табылмады');
    const fileUrl = `/api/uploads/${filename}`;
    const [document, attachment, news, event, avatar] = await Promise.all([
      prisma.document.findFirst({ where: { fileUrl } }),
      prisma.applicationAttachment.findFirst({
        where: { fileUrl },
        include: { application: { select: { member: { select: { userId: true } } } } },
      }),
      prisma.news.findFirst({
        where: { image: fileUrl, status: 'PUBLISHED', publishedAt: { lte: new Date() } },
        select: { id: true },
      }),
      prisma.event.findFirst({ where: { image: fileUrl }, select: { id: true } }),
      req.user
        ? prisma.member.findFirst({
            where: { userId: req.user.id, avatar: fileUrl },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);
    const isOwnPendingImage =
      req.user && filename.startsWith(`${req.user.id}_`) && /\.(png|jpg|jpeg)$/i.test(filename);
    const allowed =
      document ||
      news ||
      event ||
      staff(req) ||
      avatar ||
      isOwnPendingImage ||
      (attachment && req.user?.id === attachment.application.member.userId);
    if (!allowed)
      throw new HttpError(
        req.user ? 403 : 401,
        req.user ? 'Файлға рұқсатыңыз жоқ' : 'Жүйеге кіріңіз',
      );
    const extension = path.extname(filename).toLowerCase();
    const imageType = extension === '.png' ? 'image/png' : 'image/jpeg';
    await sendStoredFile(
      req,
      res,
      filename,
      document?.fileType ?? attachment?.fileType ?? imageType,
      document?.fileName ?? attachment?.fileName ?? filename,
    );
  }),
);
assetsRouter.get(
  '/:filename',
  asyncHandler(async (req, res) => {
    const filename = req.params.filename;
    if (!/^[a-zA-Z0-9_-]+\.(?:jpg|jpeg|png)$/i.test(filename))
      throw new HttpError(404, 'Сурет табылмады');
    const fileUrl = `/api/assets/${filename}`;
    const [news, event, setting] = await Promise.all([
      prisma.news.findFirst({
        where: { image: fileUrl, status: 'PUBLISHED', publishedAt: { lte: new Date() } },
        select: { id: true },
      }),
      prisma.event.findFirst({ where: { image: fileUrl }, select: { id: true } }),
      prisma.setting.findFirst({ where: { key: 'heroImage', value: fileUrl } }),
    ]);
    if (!news && !event && !setting) throw new HttpError(404, 'Сурет табылмады');
    const assetPath = path.join(path.dirname(storage.resolve('reference.png')), 'public', filename);
    try {
      if (!(await stat(assetPath)).isFile()) throw new Error('Not file');
    } catch {
      throw new HttpError(404, 'Сурет табылмады');
    }
    res.setHeader('Content-Type', filename.endsWith('.png') ? 'image/png' : 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    await new Promise<void>((resolve, reject) =>
      res.sendFile(assetPath, (error) => (error ? reject(error) : resolve())),
    );
  }),
);

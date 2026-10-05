import { Router } from 'express';
import type { Request } from 'express';
import { ApplicationStatus, ApplicationType, MemberStatus, Prisma, Role } from '@prisma/client';
import { prisma } from '../utils/prisma.js';
import { asyncHandler, HttpError, success } from '../utils/http.js';
import { pagination } from '../utils/pagination.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validation.js';
import {
  applicationCreateSchema,
  applicationUpdateSchema,
  commentSchema,
  statusSchema,
} from '../validators/core.js';
import { cleanupUpload, persistUpload, upload } from '../services/upload.js';

export const applicationsRouter = Router();
const actorSelect = {
  id: true,
  role: true,
  email: true,
  member: { select: { firstName: true, lastName: true, avatar: true } },
} as const;
const memberInclude = { user: { select: { id: true, email: true, role: true } } } as const;
const detailInclude = {
  member: { include: memberInclude },
  comments: { include: { user: { select: actorSelect } }, orderBy: { createdAt: 'asc' as const } },
  history: { include: { user: { select: actorSelect } }, orderBy: { createdAt: 'asc' as const } },
  attachments: { orderBy: { createdAt: 'desc' as const } },
} as const;
const statusLabels: Record<ApplicationStatus, string> = {
  NEW: 'Жаңа',
  IN_REVIEW: 'Қаралуда',
  NEEDS_INFO: 'Қосымша ақпарат қажет',
  APPROVED: 'Мақұлданды',
  REJECTED: 'Қабылданбады',
  COMPLETED: 'Орындалды',
};

function assertActiveMember(req: Request) {
  if (!req.user!.member) throw new HttpError(400, 'Өтініш беру үшін мүше профилі қажет');
  if (req.user!.member.status !== MemberStatus.ACTIVE)
    throw new HttpError(403, 'Белсенді емес мүшелікпен өтініш беруге болмайды');
}
async function authorizedApplication(req: Request) {
  const application = await prisma.application.findUnique({
    where: { id: req.params.id },
    include: detailInclude,
  });
  if (!application) throw new HttpError(404, 'Өтініш табылмады');
  if (req.user!.role === Role.MEMBER && application.member.userId !== req.user!.id)
    throw new HttpError(403, 'Бұл өтінішті көруге рұқсатыңыз жоқ');
  return application;
}
function assertMemberEditable(req: Request, status: ApplicationStatus) {
  if (req.user!.role === Role.MEMBER) {
    assertActiveMember(req);
    if (
      ![ApplicationStatus.NEW, ApplicationStatus.NEEDS_INFO].includes(
        status as 'NEW' | 'NEEDS_INFO',
      )
    )
      throw new HttpError(409, 'Бұл мәртебедегі өтінішті өзгертуге болмайды');
  }
}

applicationsRouter.use(requireAuth);
applicationsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, pageSize, skip, take, q } = pagination(req.query);
    const status = req.query.status === '' ? undefined : req.query.status;
    const type = req.query.type === '' ? undefined : req.query.type;
    if (
      status !== undefined &&
      (typeof status !== 'string' ||
        !Object.values(ApplicationStatus).includes(status as ApplicationStatus))
    )
      throw new HttpError(400, 'Өтініш статусы дұрыс емес');
    if (
      type !== undefined &&
      (typeof type !== 'string' ||
        !Object.values(ApplicationType).includes(type as ApplicationType))
    )
      throw new HttpError(400, 'Өтініш түрі дұрыс емес');
    const where: Prisma.ApplicationWhereInput = {
      ...(req.user!.role === Role.MEMBER ? { member: { userId: req.user!.id } } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(status ? { status: status as ApplicationStatus } : {}),
      ...(type ? { type: type as ApplicationType } : {}),
    };
    const [items, total] = await prisma.$transaction([
      prisma.application.findMany({
        where,
        include: {
          member: { include: memberInclude },
          _count: { select: { comments: true, attachments: true } },
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.application.count({ where }),
    ]);
    success(res, { items, total, page, pageSize });
  }),
);
applicationsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => success(res, await authorizedApplication(req))),
);
applicationsRouter.post(
  '/',
  upload.single('file'),
  validateBody(applicationCreateSchema),
  asyncHandler(async (req, res) => {
    assertActiveMember(req);
    const attachment = req.file ? await persistUpload(req.file) : undefined;
    try {
      const application = await prisma.$transaction(async (tx) => {
        const created = await tx.application.create({
          data: {
            ...req.body,
            memberId: req.user!.member!.id,
            history: { create: { newStatus: ApplicationStatus.NEW, changedBy: req.user!.id } },
            ...(attachment
              ? { attachments: { create: { ...attachment, uploadedBy: req.user!.id } } }
              : {}),
          },
          include: detailInclude,
        });
        await tx.notification.create({
          data: {
            userId: req.user!.id,
            title: 'Өтінішіңіз қабылданды',
            message: `«${created.title}» өтініші тіркелді. Кәсіподақ оны қарайды.`,
            type: 'APPLICATION',
            link: `/cabinet/applications/${created.id}`,
          },
        });
        const staff = await tx.user.findMany({
          where: {
            role: { in: [Role.ADMIN, Role.CHAIRMAN] },
            isActive: true,
            id: { not: req.user!.id },
          },
          select: { id: true },
        });
        if (staff.length)
          await tx.notification.createMany({
            data: staff.map((user) => ({
              userId: user.id,
              title: 'Жаңа өтініш',
              message: `«${created.title}» өтініші түсті.`,
              type: 'APPLICATION',
              link: `/admin/applications/${created.id}`,
            })),
          });
        return created;
      });
      success(res, application, 'Өтінішіңіз қабылданды', 201);
    } catch (error) {
      if (attachment) await cleanupUpload(attachment.fileUrl);
      throw error;
    }
  }),
);
applicationsRouter.put(
  '/:id',
  validateBody(applicationUpdateSchema),
  asyncHandler(async (req, res) => {
    const existing = await authorizedApplication(req);
    assertMemberEditable(req, existing.status);
    const merged = {
      type: req.body.type ?? existing.type,
      amount: req.body.amount !== undefined ? req.body.amount : existing.amount,
    };
    if (
      merged.type === ApplicationType.MATERIAL &&
      (merged.amount === null || merged.amount === undefined || Number(merged.amount) <= 0)
    )
      throw new HttpError(400, 'Материалдық көмек сомасын енгізіңіз');
    const application = await prisma.$transaction(async (tx) => {
      if (req.user!.role === Role.MEMBER) {
        const changed = await tx.application.updateMany({
          where: {
            id: existing.id,
            status: { in: [ApplicationStatus.NEW, ApplicationStatus.NEEDS_INFO] },
            member: { userId: req.user!.id, status: MemberStatus.ACTIVE },
          },
          data: req.body,
        });
        if (changed.count !== 1)
          throw new HttpError(409, 'Өтініш статусы өзгерді. Бетті жаңартыңыз');
      } else await tx.application.update({ where: { id: existing.id }, data: req.body });
      return tx.application.findUniqueOrThrow({
        where: { id: existing.id },
        include: detailInclude,
      });
    });
    success(res, application, 'Өтініш сақталды');
  }),
);
applicationsRouter.post(
  '/:id/comments',
  validateBody(commentSchema),
  asyncHandler(async (req, res) => {
    const application = await authorizedApplication(req);
    const comment = await prisma.$transaction(async (tx) => {
      const created = await tx.applicationComment.create({
        data: { applicationId: application.id, userId: req.user!.id, text: req.body.text },
        include: { user: { select: actorSelect } },
      });
      if (application.member.userId !== req.user!.id)
        await tx.notification.create({
          data: {
            userId: application.member.userId,
            title: 'Өтінішіңізге жауап берілді',
            message: `«${application.title}» өтінішіне жаңа пікір қосылды.`,
            type: 'APPLICATION',
            link: `/cabinet/applications/${application.id}`,
          },
        });
      return created;
    });
    success(res, comment, 'Пікір қосылды', 201);
  }),
);
applicationsRouter.post(
  '/:id/status',
  requireRole(Role.ADMIN, Role.CHAIRMAN),
  validateBody(statusSchema),
  asyncHandler(async (req, res) => {
    const existing = await authorizedApplication(req);
    if (existing.status === req.body.status)
      throw new HttpError(400, 'Бұл статус қазірдің өзінде қойылған');
    const application = await prisma.$transaction(async (tx) => {
      const updated = await tx.application.updateMany({
        where: { id: existing.id, status: existing.status },
        data: { status: req.body.status },
      });
      if (updated.count !== 1) throw new HttpError(409, 'Өтініш статусы өзгерді. Бетті жаңартыңыз');
      await tx.applicationStatusHistory.create({
        data: {
          applicationId: existing.id,
          oldStatus: existing.status,
          newStatus: req.body.status,
          changedBy: req.user!.id,
        },
      });
      if (req.body.comment)
        await tx.applicationComment.create({
          data: { applicationId: existing.id, userId: req.user!.id, text: req.body.comment },
        });
      await tx.notification.create({
        data: {
          userId: existing.member.userId,
          title: 'Өтінішіңіздің статусы өзгертілді',
          message: `«${existing.title}»: ${statusLabels[req.body.status as ApplicationStatus]}.`,
          type: 'STATUS',
          link: `/cabinet/applications/${existing.id}`,
        },
      });
      return tx.application.findUniqueOrThrow({
        where: { id: existing.id },
        include: detailInclude,
      });
    });
    success(res, application, 'Өтініш статусы жаңартылды');
  }),
);
applicationsRouter.post(
  '/:id/attachments',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const application = await authorizedApplication(req);
    assertMemberEditable(req, application.status);
    if (!req.file) throw new HttpError(400, 'Файлды таңдаңыз');
    const file = await persistUpload(req.file);
    try {
      const attachment = await prisma.$transaction(async (tx) => {
        if (req.user!.role === Role.MEMBER) {
          const editable = await tx.application.updateMany({
            where: {
              id: application.id,
              status: { in: [ApplicationStatus.NEW, ApplicationStatus.NEEDS_INFO] },
              member: { userId: req.user!.id, status: MemberStatus.ACTIVE },
            },
            data: { updatedAt: new Date() },
          });
          if (editable.count !== 1)
            throw new HttpError(409, 'Өтініш статусы өзгерді. Бетті жаңартыңыз');
        }
        return tx.applicationAttachment.create({
          data: { applicationId: application.id, uploadedBy: req.user!.id, ...file },
        });
      });
      success(res, attachment, 'Файл тіркелді', 201);
    } catch (error) {
      await cleanupUpload(file.fileUrl);
      throw error;
    }
  }),
);
applicationsRouter.delete(
  '/:id',
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    const application = await authorizedApplication(req);
    await prisma.application.delete({ where: { id: application.id } });
    await Promise.all(application.attachments.map((file) => cleanupUpload(file.fileUrl)));
    success(res, null, 'Өтініш жойылды');
  }),
);

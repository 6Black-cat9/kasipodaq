import { Router } from 'express';
import { MemberStatus, Prisma, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { assertOwnedImage } from '../utils/owned-image.js';
import { prisma } from '../utils/prisma.js';
import { asyncHandler, HttpError, success } from '../utils/http.js';
import { lockUserAdministration } from '../utils/admin-lock.js';
import { pagination } from '../utils/pagination.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validation.js';
import { memberCreateSchema, memberUpdateSchema } from '../validators/core.js';

export const membersRouter = Router();
const memberInclude = {
  user: { select: { id: true, email: true, role: true, isActive: true } },
} as const;
membersRouter.use(requireAuth, requireRole(Role.ADMIN, Role.CHAIRMAN));
membersRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, pageSize, skip, take, q } = pagination(req.query);
    const status = req.query.status === '' ? undefined : req.query.status;
    if (
      status !== undefined &&
      (typeof status !== 'string' || !Object.values(MemberStatus).includes(status as MemberStatus))
    )
      throw new HttpError(400, 'Мүше статусы дұрыс емес');
    const where: Prisma.MemberWhereInput = {
      ...(q
        ? {
            AND: q
              .split(/\s+/)
              .slice(0, 5)
              .map((part) => ({
                OR: ['firstName', 'lastName', 'middleName'].map((field) => ({
                  [field]: { contains: part, mode: 'insensitive' },
                })),
              })),
          }
        : {}),
      ...(typeof req.query.department === 'string' && req.query.department.trim()
        ? { department: req.query.department }
        : {}),
      ...(typeof req.query.position === 'string' && req.query.position.trim()
        ? { position: req.query.position }
        : {}),
      ...(status ? { status: status as MemberStatus } : {}),
    };
    const [items, total] = await prisma.$transaction([
      prisma.member.findMany({
        where,
        include: memberInclude,
        skip,
        take,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      }),
      prisma.member.count({ where }),
    ]);
    success(res, { items, total, page, pageSize });
  }),
);
membersRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const member = await prisma.member.findUnique({
      where: { id: req.params.id },
      include: memberInclude,
    });
    if (!member) throw new HttpError(404, 'Мүше табылмады');
    success(res, member);
  }),
);
membersRouter.post(
  '/',
  requireRole(Role.ADMIN),
  validateBody(memberCreateSchema),
  asyncHandler(async (req, res) => {
    assertOwnedImage(req.body.avatar, req.user!.id);
    const { email, password, role, ...memberData } = req.body;
    const member = await prisma.member.create({
      data: {
        ...memberData,
        user: { create: { email, password: await bcrypt.hash(password, 12), role } },
      },
      include: memberInclude,
    });
    success(res, member, 'Мүше қосылды', 201);
  }),
);
membersRouter.put(
  '/:id',
  requireRole(Role.ADMIN),
  validateBody(memberUpdateSchema),
  asyncHandler(async (req, res) => {
    const existing = await prisma.member.findUnique({
      where: { id: req.params.id },
      include: memberInclude,
    });
    if (!existing) throw new HttpError(404, 'Мүше табылмады');
    if (req.body.avatar !== existing.avatar) assertOwnedImage(req.body.avatar, req.user!.id);
    const { email, password, role, isActive, ...memberData } = req.body;
    if (
      existing.userId === req.user!.id &&
      ((role && role !== existing.user.role) || isActive === false)
    )
      throw new HttpError(400, 'Өзіңіздің рөліңізді не жүйеге кіру құқығын өзгерте алмайсыз');
    const passwordHash = password ? await bcrypt.hash(password, 12) : undefined;
    const result = await prisma.$transaction(async (tx) => {
      await lockUserAdministration(tx, req.user!.id);
      const current = await tx.member.findUniqueOrThrow({
        where: { id: existing.id },
        include: memberInclude,
      });
      if (
        current.user.role === Role.ADMIN &&
        ((role && role !== Role.ADMIN) || isActive === false)
      ) {
        const adminCount = await tx.user.count({ where: { role: Role.ADMIN, isActive: true } });
        if (adminCount <= 1) throw new HttpError(400, 'Соңғы белсенді әкімшіні өшіруге болмайды');
      }
      const revoke =
        passwordHash !== undefined ||
        (role !== undefined && role !== current.user.role) ||
        isActive === false;
      return tx.member.update({
        where: { id: existing.id },
        data: {
          ...memberData,
          user: {
            update: {
              ...(email !== undefined ? { email } : {}),
              ...(passwordHash ? { password: passwordHash } : {}),
              ...(role !== undefined ? { role } : {}),
              ...(isActive !== undefined ? { isActive } : {}),
              ...(revoke ? { tokenVersion: { increment: 1 } } : {}),
            },
          },
        },
        include: memberInclude,
      });
    });
    success(res, result, 'Мүше мәліметтері сақталды');
  }),
);
membersRouter.delete(
  '/:id',
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    const existing = await prisma.member.findUnique({
      where: { id: req.params.id },
      include: memberInclude,
    });
    if (!existing) throw new HttpError(404, 'Мүше табылмады');
    if (existing.userId === req.user!.id)
      throw new HttpError(400, 'Өз аккаунтыңызды жоюға болмайды');
    await prisma.$transaction(async (tx) => {
      await lockUserAdministration(tx, req.user!.id);
      const current = await tx.member.findUniqueOrThrow({
        where: { id: existing.id },
        include: memberInclude,
      });
      if (
        current.user.role === Role.ADMIN &&
        current.user.isActive &&
        (await tx.user.count({ where: { role: Role.ADMIN, isActive: true } })) <= 1
      )
        throw new HttpError(400, 'Соңғы әкімшіні жоюға болмайды');
      if (await tx.application.count({ where: { memberId: existing.id } }))
        throw new HttpError(409, 'Мүшенің өтініштері бар. Оны белсенді емес күйге ауыстырыңыз');
      await tx.user.delete({ where: { id: existing.userId } });
    });
    success(res, null, 'Мүше жойылды');
  }),
);

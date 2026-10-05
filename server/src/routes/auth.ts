import { Router } from 'express';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import type { Response } from 'express';
import { assertOwnedImage } from '../utils/owned-image.js';
import { prisma } from '../utils/prisma.js';
import { asyncHandler, HttpError, success } from '../utils/http.js';
import {
  jwtSecret,
  publicUser,
  requireAuth,
  requireRole,
  safeUserSelect,
} from '../middleware/auth.js';
import { validateBody } from '../middleware/validation.js';
import {
  loginSchema,
  memberCreateSchema,
  passwordSchema,
  profileSchema,
} from '../validators/core.js';
import type { AuthUser } from '../types/auth.js';

export const authRouter = Router();
const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 8 * 60 * 60 * 1000,
});
function setSession(res: Response, user: AuthUser) {
  const token = jwt.sign({ version: user.tokenVersion }, jwtSecret(), {
    subject: user.id,
    expiresIn: '8h',
    algorithm: 'HS256',
  });
  res.cookie('kasipodaq_session', token, cookieOptions());
}
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  skip: () => process.env.NODE_ENV === 'test',
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, res) =>
    res
      .status(429)
      .json({
        success: false,
        message: 'Кіру әрекеті тым көп. 15 минуттан кейін қайталаңыз',
        errors: [],
      }),
});

authRouter.post(
  '/login',
  loginLimiter,
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { email: req.body.email },
      include: { member: true },
    });
    const matches = await bcrypt.compare(
      req.body.password,
      user?.password ?? '$2b$12$KIX0OZI4.6S/YEw5UXLmS.1e9NbGGFod/sLjlWGtwtwe.tqqdq8rG',
    );
    if (!user || !matches || !user.isActive)
      throw new HttpError(401, 'Email немесе пароль дұрыс емес');
    const { password: _password, ...safeUser } = user;
    setSession(res, safeUser);
    success(res, { user: publicUser(safeUser) }, 'Жүйеге сәтті кірдіңіз');
  }),
);
authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => success(res, publicUser(req.user!))),
);
authRouter.post(
  '/logout',
  requireAuth,
  asyncHandler(async (req, res) => {
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { tokenVersion: { increment: 1 } },
    });
    const { maxAge: _maxAge, ...options } = cookieOptions();
    res.clearCookie('kasipodaq_session', options);
    success(res, null, 'Жүйеден шықтыңыз');
  }),
);
authRouter.post(
  '/register',
  requireAuth,
  requireRole(Role.ADMIN),
  validateBody(memberCreateSchema),
  asyncHandler(async (req, res) => {
    assertOwnedImage(req.body.avatar, req.user!.id);
    const { email, password, role, ...member } = req.body;
    const user = await prisma.user.create({
      data: { email, password: await bcrypt.hash(password, 12), role, member: { create: member } },
      select: safeUserSelect,
    });
    success(res, publicUser(user), 'Қолданушы тіркелді', 201);
  }),
);
authRouter.patch(
  '/profile',
  requireAuth,
  validateBody(profileSchema),
  asyncHandler(async (req, res) => {
    assertOwnedImage(req.body.avatar, req.user!.id);
    if (!req.user!.member) throw new HttpError(404, 'Мүше профилі табылмады');
    await prisma.member.update({ where: { userId: req.user!.id }, data: req.body });
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: req.user!.id },
      select: safeUserSelect,
    });
    success(res, publicUser(user), 'Профиль сақталды');
  }),
);
authRouter.post(
  '/password',
  requireAuth,
  validateBody(passwordSchema),
  asyncHandler(async (req, res) => {
    const current = await prisma.user.findUniqueOrThrow({
      where: { id: req.user!.id },
      select: { password: true },
    });
    if (!(await bcrypt.compare(req.body.currentPassword, current.password)))
      throw new HttpError(400, 'Қазіргі пароль дұрыс емес');
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        password: await bcrypt.hash(req.body.newPassword, 12),
        tokenVersion: { increment: 1 },
      },
      select: safeUserSelect,
    });
    setSession(res, user);
    success(res, publicUser(user), 'Пароль жаңартылды');
  }),
);

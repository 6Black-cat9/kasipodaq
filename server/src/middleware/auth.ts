import type { Request, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { prisma } from '../utils/prisma.js';
import { asyncHandler, HttpError } from '../utils/http.js';
import type { AuthUser } from '../types/auth.js';

export const safeUserSelect = {
  id: true,
  email: true,
  role: true,
  isActive: true,
  tokenVersion: true,
  createdAt: true,
  updatedAt: true,
  member: true,
} as const;

export function publicUser(user: AuthUser) {
  const { tokenVersion: _tokenVersion, ...result } = user;
  return result;
}

export function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error('JWT_SECRET кемінде 32 таңбадан тұруы керек');
  return secret;
}

export function allowedOrigins(): string[] {
  return (process.env.CLIENT_URL ?? 'http://localhost:5173')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

export function sessionCookie(req: Request): string | undefined {
  const cookies = req.headers.cookie?.split(';') ?? [];
  const value = cookies
    .map((item) => item.trim())
    .find((item) => item.startsWith('kasipodaq_session='));
  if (!value) return undefined;
  try {
    return decodeURIComponent(value.slice('kasipodaq_session='.length));
  } catch {
    return undefined;
  }
}

const authenticate = (required: boolean): RequestHandler =>
  asyncHandler(async (req, _res, next) => {
    const authorization = req.headers.authorization;
    const bearer = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;
    const cookie = sessionCookie(req);
    const token = bearer ?? cookie;
    if (!token) {
      if (required) throw new HttpError(401, 'Жүйеге кіріңіз');
      return next();
    }
    if (!bearer && cookie && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      const origin = req.headers.origin;
      if (origin && !allowedOrigins().includes(origin))
        throw new HttpError(403, 'Сұрау көзіне рұқсат берілмеген');
    }
    let decoded: jwt.JwtPayload;
    try {
      const payload = jwt.verify(token, jwtSecret(), { algorithms: ['HS256'] });
      if (
        typeof payload === 'string' ||
        typeof payload.sub !== 'string' ||
        typeof payload.version !== 'number'
      )
        throw new Error('Invalid token');
      decoded = payload;
    } catch {
      if (!required) return next();
      throw new HttpError(401, 'Сессия мерзімі аяқталды. Жүйеге қайта кіріңіз');
    }
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: safeUserSelect,
    });
    if (!user || !user.isActive || user.tokenVersion !== decoded.version) {
      if (!required) return next();
      throw new HttpError(401, 'Сессия жарамсыз. Жүйеге қайта кіріңіз');
    }
    req.user = user;
    next();
  });

export const requireAuth = authenticate(true);
export const optionalAuth = authenticate(false);
export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(new HttpError(401, 'Жүйеге кіріңіз'));
    if (!roles.includes(req.user.role))
      return next(new HttpError(403, 'Бұл әрекетке рұқсатыңыз жоқ'));
    next();
  };
export const requireRoles = requireRole;

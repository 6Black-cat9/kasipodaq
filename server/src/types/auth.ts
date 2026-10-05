import type { Member, Role } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
  member: Member | null;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

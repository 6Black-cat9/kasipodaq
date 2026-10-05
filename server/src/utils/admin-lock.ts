import { Prisma, Role } from '@prisma/client';
import { HttpError } from './http.js';

/** Serialize administrative account mutations so the last active admin is retained. */
export async function lockUserAdministration(tx: Prisma.TransactionClient, actorId: string) {
  await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(791357913)`;
  const actor = await tx.user.findUnique({
    where: { id: actorId },
    select: { role: true, isActive: true },
  });
  if (!actor?.isActive || actor.role !== Role.ADMIN)
    throw new HttpError(403, 'Әкімші құқығы өзгерді. Жүйеге қайта кіріңіз');
}

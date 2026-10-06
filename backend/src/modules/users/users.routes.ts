import { Router } from 'express';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../../shared/db';
import { HttpError, ok } from '../../shared/http';
import { authenticate, requirePermission } from '../auth/auth.middleware';
import { password } from '../auth/auth.schema';
import { requestReset } from '../auth/auth.service';
import { rolePermissions } from '../../shared/permissions';
import { rateLimit } from 'express-rate-limit';

export const usersRouter = Router();
usersRouter.use(authenticate, requirePermission('USER_MANAGE'));
const fields = {
  name: z.string().trim().min(2).max(150),
  email: z
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  role: z.enum(Role),
};
const selection = {
  id: true,
  name: true,
  email: true,
  role: true,
  active: true,
  lastLoginAt: true,
  mustChangePassword: true,
} as const;
usersRouter.get('/roles', (_req, res) => ok(res, rolePermissions));
usersRouter.post(
  '/:id/reset-password',
  rateLimit({ windowMs: 15 * 60 * 1000, limit: 20 }),
  async (req, res) => {
    const id = z.uuid().parse(req.params.id);
    const actor = req.identity!;
    const member = await db.user.findFirst({
      where: { id, organizationId: actor.organizationId, active: true },
    });
    if (!member) throw new HttpError(404, 'Active team member not found.');
    await requestReset(member.email);
    await db.auditLog.create({
      data: {
        organizationId: actor.organizationId,
        actorId: actor.id,
        action: 'USER_RESET_REQUESTED',
        entity: 'User',
        entityId: id,
      },
    });
    return ok(res, null, 'Password reset requested through the configured delivery service.', 202);
  },
);
usersRouter.get('/', async (req, res) => {
  const query = z
    .object({
      search: z.string().trim().max(150).optional(),
      role: z.enum(Role).optional(),
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
      sort: z.enum(['name', 'createdAt', 'lastLoginAt']).default('name'),
      direction: z.enum(['asc', 'desc']).default('asc'),
    })
    .strict()
    .parse(req.query);
  const where = {
    organizationId: req.identity!.organizationId,
    ...(query.role ? { role: query.role } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' as const } },
            { email: { contains: query.search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };
  const paginate = query.page !== undefined || query.limit !== undefined;
  const page = query.page || 1,
    limit = query.limit || 20;
  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      select: selection,
      orderBy: { [query.sort]: query.direction },
      ...(paginate ? { skip: (page - 1) * limit, take: limit } : {}),
    }),
    db.user.count({ where }),
  ]);
  return ok(res, users, 'Success', 200, {
    page,
    limit: paginate ? limit : Math.max(total, 1),
    total,
    totalPages: paginate ? Math.max(1, Math.ceil(total / limit)) : 1,
  });
});
usersRouter.post('/', async (req, res) => {
  const input = z
    .object({ ...fields, password })
    .strict()
    .parse(req.body);
  const actor = req.identity!;
  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM organizations WHERE id = ${actor.organizationId}::uuid FOR UPDATE`;
    const currentActor = await tx.user.findUnique({ where: { id: actor.id } });
    if (!currentActor?.active || currentActor.role !== 'ADMINISTRATOR')
      throw new HttpError(403, 'Administrator access is required.');
    const created = await tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        role: input.role,
        passwordHash,
        mustChangePassword: true,
        organizationId: actor.organizationId,
      },
      select: selection,
    });
    await tx.auditLog.create({
      data: {
        organizationId: actor.organizationId,
        actorId: actor.id,
        action: 'USER_CREATED',
        entity: 'User',
        entityId: created.id,
      },
    });
    return created;
  });
  await requestReset(input.email);
  return ok(
    res,
    user,
    'Team member created and an invitation link was sent through the configured delivery service.',
    201,
  );
});
usersRouter.patch('/:id', async (req, res) => {
  const id = z.uuid().parse(req.params.id);
  const input = z
    .object({ ...fields, active: z.boolean() })
    .strict()
    .parse(req.body);
  const actor = req.identity!;
  if (id === actor.id && (!input.active || input.role !== 'ADMINISTRATOR'))
    throw new HttpError(
      409,
      'You cannot deactivate or change the role of your own administrator account.',
    );
  const user = await db.$transaction(async (tx) => {
    // Serialize access changes in this organization, including simultaneous administrator edits.
    await tx.$queryRaw`SELECT id FROM organizations WHERE id = ${actor.organizationId}::uuid FOR UPDATE`;
    const currentActor = await tx.user.findUnique({ where: { id: actor.id } });
    if (!currentActor?.active || currentActor.role !== 'ADMINISTRATOR')
      throw new HttpError(403, 'Administrator access is required.');
    const existing = await tx.user.findFirst({
      where: { id, organizationId: actor.organizationId },
    });
    if (!existing) throw new HttpError(404, 'Team member not found.');
    const updated = await tx.user.update({ where: { id }, data: input, select: selection });
    if (existing.role !== input.role || existing.email !== input.email || !input.active) {
      await tx.authSession.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await tx.passwordReset.updateMany({
        where: { userId: id, usedAt: null },
        data: { usedAt: new Date() },
      });
    }
    await tx.auditLog.create({
      data: {
        organizationId: actor.organizationId,
        actorId: actor.id,
        action: 'USER_UPDATED',
        entity: 'User',
        entityId: id,
      },
    });
    return updated;
  });
  return ok(res, user, 'Team member updated.');
});

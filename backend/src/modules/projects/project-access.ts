import { Prisma } from '@prisma/client';
import { Identity } from '../auth/auth.middleware';
import { HttpError } from '../../shared/http';
import { rolePermissions } from '../../shared/permissions';

export function projectScope(
  user: Pick<Identity, 'id' | 'organizationId' | 'role'>,
): Prisma.ProjectWhereInput {
  return {
    organizationId: user.organizationId,
    ...(user.role === 'ADMINISTRATOR' ? {} : { members: { some: { userId: user.id } } }),
  };
}
export async function accessProject(
  tx: Prisma.TransactionClient,
  id: string,
  actor: Identity,
  permission: string,
  write = false,
) {
  if (write) await tx.$queryRaw`SELECT id FROM projects WHERE id = ${id}::uuid FOR UPDATE`;
  const current = await tx.user.findUnique({ where: { id: actor.id } });
  if (!current?.active || !rolePermissions[current.role].includes(permission))
    throw new HttpError(403, 'You do not have permission to perform this action.');
  const project = await tx.project.findFirst({ where: { id, ...projectScope(current) } });
  if (!project) throw new HttpError(404, 'Project not found.');
  if (write && ['COMPLETED', 'CLOSED', 'CANCELLED'].includes(project.status))
    throw new HttpError(409, 'Reopen this project before changing its operational records.');
  return project;
}
export async function projectAudit(
  tx: Prisma.TransactionClient,
  actor: Identity,
  action: string,
  entity: string,
  id: string,
) {
  await tx.auditLog.create({
    data: { organizationId: actor.organizationId, actorId: actor.id, action, entity, entityId: id },
  });
}
export function scheduleSummary(
  items: {
    kind: string;
    progress: number;
    status: string;
    plannedDate: Date;
    weight?: Prisma.Decimal | number | string;
  }[],
) {
  const milestones = items.filter((item) => item.kind === 'MILESTONE');
  const basis = milestones.length ? milestones : items;
  const today = new Date().toISOString().slice(0, 10);
  return {
    progress: basis.length
      ? Math.round(
          basis.reduce((sum, item) => sum + item.progress * Number(item.weight ?? 1), 0) /
            basis.reduce((sum, item) => sum + Number(item.weight ?? 1), 0),
        )
      : 0,
    basis: milestones.length ? 'Weighted milestone average' : 'Weighted task average',
    total: items.length,
    completed: items.filter((item) => item.status === 'COMPLETED').length,
    overdue: items.filter(
      (item) => item.status !== 'COMPLETED' && item.plannedDate.toISOString().slice(0, 10) < today,
    ).length,
  };
}

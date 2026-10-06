import { Router } from 'express';
import { Prisma, ProjectStatus } from '@prisma/client';
import { z } from 'zod';
import { scheduleSummary } from './project-access';
import { db } from '../../shared/db';
import { HttpError, ok } from '../../shared/http';
import { rolePermissions } from '../../shared/permissions';
import { authenticate, Identity, requirePermission } from '../auth/auth.middleware';

export const projectsRouter = Router();
projectsRouter.use(authenticate, requirePermission('PROJECT_VIEW'));
const text = (max: number) => z.string().trim().min(1).max(max);
const money = z
  .string()
  .regex(/^\d{1,14}(\.\d{1,2})?$/, 'Enter a nonnegative amount with at most two decimal places.');
const date = z.iso.date().transform((value) => new Date(value + 'T00:00:00Z'));
const schema = z
  .object({
    code: text(30).regex(
      /^[A-Z0-9-]+$/,
      'Project code must use uppercase letters, numbers and hyphens.',
    ),
    name: text(150),
    description: z.string().trim().max(5000).default(''),
    category: text(80),
    address: text(300),
    city: text(100),
    state: text(100),
    country: text(100),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    startDate: date,
    endDate: date,
    budget: money,
    estimatedCost: money,
    notes: z.string().trim().max(5000).default(''),
    memberIds: z
      .array(z.uuid())
      .max(200)
      .transform((ids) => [...new Set(ids)]),
  })
  .strict()
  .refine((value) => value.endDate >= value.startDate, {
    path: ['endDate'],
    message: 'End date must be on or after the start date.',
  });
const include = {
  workItems: { select: { kind: true, progress: true, status: true, plannedDate: true } },
  members: { select: { user: { select: { id: true, name: true, role: true, active: true } } } },
} as const;
function scope(user: Identity): Prisma.ProjectWhereInput {
  return {
    organizationId: user.organizationId,
    ...(user.role === 'ADMINISTRATOR' ? {} : { members: { some: { userId: user.id } } }),
  };
}
function visible<
  T extends {
    budget: Prisma.Decimal;
    estimatedCost: Prisma.Decimal;
    workItems: { kind: string; progress: number; status: string; plannedDate: Date }[];
  },
>(project: T, actor: Identity) {
  const { workItems, ...data } = project;
  const schedule = scheduleSummary(workItems);
  if (rolePermissions[actor.role].includes('BUDGET_VIEW')) return { ...data, schedule };
  const { budget: _budget, estimatedCost: _estimatedCost, ...rest } = data;
  return { ...rest, schedule };
}
async function validateMembers(
  tx: Prisma.TransactionClient,
  ids: string[],
  organizationId: string,
) {
  const count = await tx.user.count({ where: { id: { in: ids }, organizationId, active: true } });
  if (count !== ids.length)
    throw new HttpError(422, 'All assigned members must be active users in your organization.');
}
projectsRouter.get('/team-options', requirePermission('PROJECT_CREATE'), async (req, res) => {
  return ok(
    res,
    await db.user.findMany({
      where: { organizationId: req.identity!.organizationId, active: true },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' },
    }),
  );
});
projectsRouter.get('/', async (req, res) => {
  const query = z
    .object({ search: z.string().max(150).optional(), status: z.enum(ProjectStatus).optional() })
    .strict()
    .parse(req.query);
  const projects = await db.project.findMany({
    where: {
      ...scope(req.identity!),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { code: { contains: query.search, mode: 'insensitive' } },
              { city: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    include,
    orderBy: { createdAt: 'desc' },
  });
  return ok(
    res,
    projects.map((project) => visible(project, req.identity!)),
  );
});
projectsRouter.get('/:id', async (req, res) => {
  const id = z.uuid().parse(req.params.id);
  const project = await db.project.findFirst({ where: { id, ...scope(req.identity!) }, include });
  if (!project) throw new HttpError(404, 'Project not found.');
  return ok(res, visible(project, req.identity!));
});
projectsRouter.post('/', requirePermission('PROJECT_CREATE'), async (req, res) => {
  const { memberIds, ...data } = schema.parse(req.body);
  const actor = req.identity!;
  const ids = [...new Set([...memberIds, actor.id])];
  const project = await db.$transaction(async (tx) => {
    await validateMembers(tx, ids, actor.organizationId);
    const created = await tx.project.create({
      data: {
        ...data,
        organizationId: actor.organizationId,
        members: { create: ids.map((userId) => ({ userId })) },
      },
      include,
    });
    await tx.auditLog.create({
      data: {
        organizationId: actor.organizationId,
        actorId: actor.id,
        action: 'PROJECT_CREATED',
        entity: 'Project',
        entityId: created.id,
      },
    });
    return created;
  });
  return ok(res, visible(project, actor), 'Project created.', 201);
});
projectsRouter.patch('/:id', requirePermission('PROJECT_EDIT'), async (req, res) => {
  const id = z.uuid().parse(req.params.id);
  const { memberIds, ...data } = schema.parse(req.body);
  const actor = req.identity!;
  const project = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM projects WHERE id = ${id}::uuid FOR UPDATE`;
    const existing = await tx.project.findFirst({ where: { id, ...scope(actor) } });
    if (!existing) throw new HttpError(404, 'Project not found.');
    if (['CLOSED', 'CANCELLED'].includes(existing.status))
      throw new HttpError(409, 'Closed or cancelled projects cannot be edited.');
    const ids = [...new Set([...memberIds, actor.id])];
    await validateMembers(tx, ids, actor.organizationId);
    const schedule = await tx.workItem.findMany({ where: { projectId: id } });
    if (schedule.some((item) => item.startDate < data.startDate || item.plannedDate > data.endDate))
      throw new HttpError(
        409,
        'Project dates must contain the existing schedule. Update schedule items first.',
      );
    if (
      schedule.some(
        (item) =>
          item.responsibleId && !ids.includes(item.responsibleId) && item.status !== 'COMPLETED',
      )
    )
      throw new HttpError(
        409,
        'Reassign unfinished schedule items before removing their responsible members.',
      );
    await tx.projectMember.deleteMany({ where: { projectId: id } });
    const updated = await tx.project.update({
      where: { id },
      data: { ...data, members: { create: ids.map((userId) => ({ userId })) } },
      include,
    });
    await tx.auditLog.create({
      data: {
        organizationId: actor.organizationId,
        actorId: actor.id,
        action: 'PROJECT_UPDATED',
        entity: 'Project',
        entityId: id,
      },
    });
    return updated;
  });
  return ok(res, visible(project, actor), 'Project updated.');
});
projectsRouter.patch('/:id/status', requirePermission('PROJECT_CLOSE'), async (req, res) => {
  const id = z.uuid().parse(req.params.id);
  const { status } = z
    .object({ status: z.enum(ProjectStatus) })
    .strict()
    .parse(req.body);
  const actor = req.identity!;
  const transitions: Record<ProjectStatus, ProjectStatus[]> = {
    PLANNING: ['ACTIVE', 'CANCELLED'],
    ACTIVE: ['ON_HOLD', 'DELAYED', 'COMPLETED', 'CANCELLED'],
    ON_HOLD: ['ACTIVE', 'CANCELLED'],
    DELAYED: ['ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'],
    COMPLETED: ['ACTIVE', 'CLOSED'],
    CLOSED: [],
    CANCELLED: [],
  };
  const project = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM projects WHERE id = ${id}::uuid FOR UPDATE`;
    const current = await tx.project.findFirst({ where: { id, ...scope(actor) } });
    if (!current) throw new HttpError(404, 'Project not found.');
    if (!transitions[current.status].includes(status))
      throw new HttpError(409, 'This status transition is not allowed.');
    if (['COMPLETED', 'CLOSED'].includes(status)) {
      const items = await tx.workItem.findMany({ where: { projectId: id } });
      if (
        !items.some((item) => item.kind === 'MILESTONE') ||
        items.some((item) => item.status !== 'COMPLETED')
      )
        throw new HttpError(
          409,
          'Complete at least one milestone and every schedule item before completing or closing the project.',
        );
      if (
        await tx.siteDelay.count({
          where: { projectId: id, critical: true, status: { not: 'RESOLVED' } },
        })
      )
        throw new HttpError(
          409,
          'Resolve critical delays before completing or closing the project.',
        );
      if (
        await tx.inspection.count({
          where: { projectId: id, result: { in: ['FAILED', 'CONDITIONAL'] }, resolved: false },
        })
      )
        throw new HttpError(
          409,
          'Resolve inspection findings before completing or closing the project.',
        );
    }
    if (status === 'CLOSED') {
      const [handoverDocuments, pendingExpenses, unsettledInvoices, openOrders, pendingRequests] =
        await Promise.all([
          tx.document.count({ where: { projectId: id, category: { in: ['Contract', 'Handover'], mode: 'insensitive' }, versions: { some: {} } } }),
          tx.expense.count({ where: { projectId: id, status: { in: ['SUBMITTED', 'APPROVED'] } } }),
          tx.invoice.count({ where: { purchaseOrder: { request: { projectId: id } }, status: { not: 'PAID' } } }),
          tx.purchaseOrder.count({ where: { request: { projectId: id }, status: { in: ['ISSUED', 'PARTIALLY_RECEIVED'] } } }),
          tx.procurementRequest.count({ where: { projectId: id, status: { in: ['SUBMITTED', 'APPROVED'] } } }),
        ]);
      if (!handoverDocuments)
        throw new HttpError(409, 'Upload at least one versioned Contract or Handover document before closing the project.');
      if (pendingExpenses || unsettledInvoices || openOrders || pendingRequests)
        throw new HttpError(409, 'Settle pending expenses, invoices, purchase orders and procurement requests before closing the project.');
    }
    const updated = await tx.project.update({ where: { id }, data: { status }, include });
    await tx.auditLog.create({
      data: {
        organizationId: actor.organizationId,
        actorId: actor.id,
        action: `PROJECT_STATUS_${status}`,
        entity: 'Project',
        entityId: id,
      },
    });
    return updated;
  });
  return ok(res, visible(project, actor), 'Project status updated.');
});

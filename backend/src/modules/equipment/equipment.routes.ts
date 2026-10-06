import { Router } from 'express';
import { EquipmentStatus, MaintenanceStatus } from '@prisma/client';
import { z } from 'zod';
import { db } from '../../shared/db';
import { HttpError, ok } from '../../shared/http';
import { authenticate, requirePermission } from '../auth/auth.middleware';
import { accessProject, projectAudit } from '../projects/project-access';

export const equipmentRouter = Router();
equipmentRouter.use(authenticate, requirePermission('RESOURCE_VIEW'));
const text = (max: number) => z.string().trim().min(1).max(max);
const equipmentSchema = z
  .object({
    code: text(40).regex(/^[A-Z0-9-]+$/),
    name: text(150),
    type: text(100),
    location: text(200),
    hourlyRate: z.string().regex(/^\d{1,10}(\.\d{1,2})?$/),
    commissionedAt: z.iso.date().transform((value) => new Date(value + 'T00:00:00Z')).nullable().default(null),
    serviceIntervalDays: z.number().int().min(1).max(3650).default(90),
    notes: z.string().trim().max(3000).default(''),
    status: z.enum(EquipmentStatus).default('AVAILABLE'),
  })
  .strict();
const include = {
  allocations: {
    where: { releasedAt: null, endAt: { gt: new Date() } },
    include: {
      project: { select: { id: true, name: true } },
      operator: { select: { id: true, name: true } },
    },
    orderBy: { startAt: 'asc' as const },
  },
  maintenance: {
    where: { status: { in: ['SCHEDULED', 'IN_PROGRESS'] as MaintenanceStatus[] } },
    orderBy: { scheduledAt: 'asc' as const },
  },
};
equipmentRouter.get('/', async (req, res) => {
  const records = await db.equipment.findMany({
    where: { organizationId: req.identity!.organizationId, active: true },
    include,
    orderBy: { name: 'asc' },
  });
  const total = records.length,
    inUse = records.filter((row) => row.status === 'IN_USE').length;
  return ok(res, {
    records,
    summary: {
      total,
      available: records.filter((row) => row.status === 'AVAILABLE').length,
      inUse,
      maintenance: records.filter((row) => row.status === 'MAINTENANCE').length,
      utilization: total ? Math.round((inUse / total) * 100) : 0,
    },
  });
});
equipmentRouter.post('/', requirePermission('RESOURCE_MAINTAIN'), async (req, res) => {
  const input = equipmentSchema.parse(req.body);
  const actor = req.identity!;
  const record = await db.$transaction(async (tx) => {
    const created = await tx.equipment.create({
      data: { ...input, organizationId: actor.organizationId },
    });
    await projectAudit(tx, actor, 'EQUIPMENT_CREATED', 'Equipment', created.id);
    return created;
  });
  return ok(res, record, 'Equipment added.', 201);
});
equipmentRouter.patch('/:id', requirePermission('RESOURCE_MAINTAIN'), async (req, res) => {
  const id = z.uuid().parse(req.params.id);
  const { version, ...input } = equipmentSchema
    .extend({ version: z.number().int().positive() })
    .parse(req.body);
  const actor = req.identity!;
  const record = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM equipment WHERE id = ${id}::uuid FOR UPDATE`;
    const current = await tx.equipment.findFirst({
      where: { id, organizationId: actor.organizationId, active: true },
    });
    if (!current) throw new HttpError(404, 'Equipment not found.');
    if (current.version !== version)
      throw new HttpError(409, 'This equipment changed. Reload before saving.');
    if (['IN_USE', 'MAINTENANCE'].includes(current.status) && input.status === 'AVAILABLE')
      throw new HttpError(
        409,
        'Release the allocation or complete maintenance before marking available.',
      );
    const saved = await tx.equipment.update({
      where: { id },
      data: { ...input, version: { increment: 1 } },
    });
    await projectAudit(tx, actor, 'EQUIPMENT_UPDATED', 'Equipment', id);
    return saved;
  });
  return ok(res, record, 'Equipment updated.');
});
const allocationSchema = z
  .object({
    projectId: z.uuid(),
    operatorId: z.uuid().nullable(),
    startAt: z.iso.datetime({ offset: true }).transform((v) => new Date(v)),
    endAt: z.iso.datetime({ offset: true }).transform((v) => new Date(v)),
    notes: z.string().trim().max(2000).default(''),
  })
  .strict()
  .refine((v) => v.endAt > v.startAt, {
    path: ['endAt'],
    message: 'Allocation end must be after its start.',
  });
equipmentRouter.post(
  '/:id/allocations',
  requirePermission('RESOURCE_ALLOCATE'),
  async (req, res) => {
    const equipmentId = z.uuid().parse(req.params.id);
    const input = allocationSchema.parse(req.body);
    const actor = req.identity!;
    const result = await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM equipment WHERE id = ${equipmentId}::uuid FOR UPDATE`;
      const equipment = await tx.equipment.findFirst({
        where: { id: equipmentId, organizationId: actor.organizationId, active: true },
      });
      if (!equipment) throw new HttpError(404, 'Equipment not found.');
      if (['MAINTENANCE', 'UNAVAILABLE'].includes(equipment.status))
        throw new HttpError(409, 'This equipment is not available for allocation.');
      await accessProject(tx, input.projectId, actor, 'RESOURCE_ALLOCATE');
      if (
        input.operatorId &&
        !(await tx.projectMember.findFirst({
          where: { projectId: input.projectId, userId: input.operatorId, user: { active: true } },
        }))
      )
        throw new HttpError(422, 'Operator must be an active member of the selected project.');
      if (
        await tx.equipmentAllocation.count({
          where: {
            equipmentId,
            releasedAt: null,
            startAt: { lt: input.endAt },
            endAt: { gt: input.startAt },
          },
        })
      )
        throw new HttpError(409, 'Equipment is already allocated during this time.');
      if (
        await tx.maintenanceRecord.count({
          where: {
            equipmentId,
            status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
            scheduledAt: { gte: input.startAt, lte: input.endAt },
          },
        })
      )
        throw new HttpError(409, 'Equipment has maintenance scheduled during this allocation.');
      const saved = await tx.equipmentAllocation.create({ data: { ...input, equipmentId } });
      if (input.startAt <= new Date() && input.endAt > new Date())
        await tx.equipment.update({
          where: { id: equipmentId },
          data: { status: 'IN_USE', version: { increment: 1 } },
        });
      await projectAudit(tx, actor, 'EQUIPMENT_ALLOCATED', 'Equipment', equipmentId);
      return saved;
    });
    return ok(res, result, 'Equipment allocated.', 201);
  },
);
equipmentRouter.patch(
  '/:equipmentId/allocations/:id/release',
  requirePermission('RESOURCE_ALLOCATE'),
  async (req, res) => {
    const equipmentId = z.uuid().parse(req.params.equipmentId),
      id = z.uuid().parse(req.params.id),
      actor = req.identity!;
    const result = await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM equipment WHERE id = ${equipmentId}::uuid FOR UPDATE`;
      const allocation = await tx.equipmentAllocation.findFirst({
        where: { id, equipmentId, equipment: { organizationId: actor.organizationId } },
      });
      if (!allocation) throw new HttpError(404, 'Allocation not found.');
      if (allocation.releasedAt) throw new HttpError(409, 'Allocation is already released.');
      const saved = await tx.equipmentAllocation.update({
        where: { id },
        data: { releasedAt: new Date() },
      });
      await tx.equipment.update({
        where: { id: equipmentId },
        data: { status: 'AVAILABLE', version: { increment: 1 } },
      });
      await projectAudit(tx, actor, 'EQUIPMENT_RELEASED', 'Equipment', equipmentId);
      return saved;
    });
    return ok(res, result, 'Equipment released.');
  },
);
const maintenanceSchema = z
  .object({
    type: text(120),
    scheduledAt: z.iso.datetime({ offset: true }).transform((v) => new Date(v)),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    failureRelated: z.boolean().default(false),
    downtimeHours: z.coerce.number().min(0).max(9_999_999).multipleOf(0.01).default(0),
    notes: z.string().trim().max(3000).default(''),
  })
  .strict();
equipmentRouter.post(
  '/:id/maintenance',
  requirePermission('RESOURCE_MAINTAIN'),
  async (req, res) => {
    const equipmentId = z.uuid().parse(req.params.id);
    const input = maintenanceSchema.parse(req.body);
    const actor = req.identity!;
    const result = await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM equipment WHERE id = ${equipmentId}::uuid FOR UPDATE`;
      const equipment = await tx.equipment.findFirst({
        where: { id: equipmentId, organizationId: actor.organizationId, active: true },
      });
      if (!equipment) throw new HttpError(404, 'Equipment not found.');
      if (
        await tx.equipmentAllocation.count({
          where: {
            equipmentId,
            releasedAt: null,
            startAt: { lte: input.scheduledAt },
            endAt: { gte: input.scheduledAt },
          },
        })
      )
        throw new HttpError(409, 'Release or reschedule the overlapping allocation first.');
      const saved = await tx.maintenanceRecord.create({ data: { ...input, equipmentId } });
      await projectAudit(tx, actor, 'MAINTENANCE_SCHEDULED', 'Equipment', equipmentId);
      return saved;
    });
    return ok(res, result, 'Maintenance scheduled.', 201);
  },
);
equipmentRouter.patch(
  '/:equipmentId/maintenance/:id',
  requirePermission('RESOURCE_MAINTAIN'),
  async (req, res) => {
    const equipmentId = z.uuid().parse(req.params.equipmentId),
      id = z.uuid().parse(req.params.id),
      actor = req.identity!;
    const input = z
      .object({ status: z.enum(MaintenanceStatus), version: z.number().int().positive() })
      .strict()
      .parse(req.body);
    const result = await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM equipment WHERE id = ${equipmentId}::uuid FOR UPDATE`;
      const current = await tx.maintenanceRecord.findFirst({
        where: { id, equipmentId, equipment: { organizationId: actor.organizationId } },
      });
      if (!current) throw new HttpError(404, 'Maintenance record not found.');
      if (current.version !== input.version)
        throw new HttpError(409, 'This maintenance record changed. Reload before saving.');
      if (['COMPLETED', 'CANCELLED'].includes(current.status))
        throw new HttpError(409, 'This maintenance record is final.');
      const completedAt = input.status === 'COMPLETED' ? new Date() : null;
      const saved = await tx.maintenanceRecord.update({
        where: { id },
        data: { status: input.status, completedAt, version: { increment: 1 } },
      });
      await tx.equipment.update({
        where: { id: equipmentId },
        data: {
          status: input.status === 'IN_PROGRESS' ? 'MAINTENANCE' : 'AVAILABLE',
          version: { increment: 1 },
        },
      });
      await projectAudit(tx, actor, 'MAINTENANCE_UPDATED', 'Equipment', equipmentId);
      return saved;
    });
    return ok(res, result, 'Maintenance updated.');
  },
);

import { Router } from 'express';
import { MaterialRequestStatus, Prisma } from '@prisma/client';
import { z } from 'zod';
import { db } from '../../shared/db';
import { HttpError, ok } from '../../shared/http';
import { authenticate, requirePermission } from '../auth/auth.middleware';
import { accessProject, projectAudit, projectScope } from '../projects/project-access';

export const inventoryRouter = Router();
inventoryRouter.use(authenticate);
const decimal = z
  .string()
  .regex(
    /^\d{1,13}(\.\d{1,3})?$/,
    'Enter a nonnegative quantity with at most three decimal places.',
  );
const signedDecimal = z.string().regex(/^-?\d{1,13}(\.\d{1,3})?$/);
const materialSchema = z
  .object({
    sku: z
      .string()
      .trim()
      .min(1)
      .max(50)
      .regex(/^[A-Z0-9-]+$/),
    name: z.string().trim().min(2).max(150),
    category: z.string().trim().min(2).max(100),
    unit: z.string().trim().min(1).max(30),
    currentStock: decimal,
    minimumLevel: decimal,
    criticalLevel: decimal,
    unitCost: z.string().regex(/^\d{1,13}(\.\d{1,2})?$/),
    supplier: z.string().trim().max(160).default(''),
  })
  .strict()
  .refine((v) => new Prisma.Decimal(v.criticalLevel).lte(v.minimumLevel), {
    path: ['criticalLevel'],
    message: 'Critical level cannot exceed minimum level.',
  });
const include = {
  material: { select: { id: true, sku: true, name: true, unit: true } },
  project: { select: { id: true, name: true } },
  requester: { select: { id: true, name: true } },
  approvedBy: { select: { id: true, name: true } },
} as const;
inventoryRouter.get('/', requirePermission('INVENTORY_VIEW'), async (req, res) => {
  const materials = await db.material.findMany({
    where: { organizationId: req.identity!.organizationId, active: true },
    include: { movements: { orderBy: { createdAt: 'desc' }, take: 5 } },
    orderBy: { name: 'asc' },
  });
  const requests = await db.materialRequest.findMany({
    where: { project: { ...projectScope(req.identity!) } },
    include,
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  const status = (m: (typeof materials)[number]) =>
    m.currentStock.minus(m.allocatedStock).lte(0)
      ? 'OUT_OF_STOCK'
      : m.currentStock.minus(m.allocatedStock).lte(m.criticalLevel)
        ? 'CRITICAL'
        : m.currentStock.minus(m.allocatedStock).lte(m.minimumLevel)
          ? 'LOW_STOCK'
          : 'HEALTHY';
  return ok(res, {
    materials: materials.map((m) => ({ ...m, stockStatus: status(m) })),
    requests,
    summary: {
      total: materials.length,
      low: materials.filter((m) => status(m) === 'LOW_STOCK').length,
      critical: materials.filter((m) => status(m) === 'CRITICAL').length,
      out: materials.filter((m) => status(m) === 'OUT_OF_STOCK').length,
      pending: requests.filter((r) => ['SUBMITTED', 'APPROVED'].includes(r.status)).length,
    },
  });
});
inventoryRouter.post('/materials', requirePermission('INVENTORY_UPDATE'), async (req, res) => {
  const input = materialSchema.parse(req.body),
    actor = req.identity!;
  const material = await db.$transaction(async (tx) => {
    const created = await tx.material.create({
      data: { ...input, organizationId: actor.organizationId },
    });
    if (new Prisma.Decimal(input.currentStock).gt(0))
      await tx.stockMovement.create({
        data: {
          materialId: created.id,
          type: 'RECEIPT',
          stockDelta: input.currentStock,
          allocatedDelta: 0,
          balanceAfter: input.currentStock,
          allocatedAfter: 0,
          note: 'Opening stock',
        },
      });
    await projectAudit(tx, actor, 'MATERIAL_CREATED', 'Material', created.id);
    return created;
  });
  return ok(res, material, 'Material created.', 201);
});
inventoryRouter.post(
  '/materials/:id/adjust',
  requirePermission('INVENTORY_UPDATE'),
  async (req, res) => {
    const id = z.uuid().parse(req.params.id),
      input = z
        .object({
          delta: signedDecimal,
          note: z.string().trim().min(2).max(1000),
          version: z.number().int().positive(),
        })
        .strict()
        .parse(req.body),
      actor = req.identity!;
    const material = await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM materials WHERE id=${id}::uuid FOR UPDATE`;
      const current = await tx.material.findFirst({
        where: { id, organizationId: actor.organizationId, active: true },
      });
      if (!current) throw new HttpError(404, 'Material not found.');
      if (current.version !== input.version)
        throw new HttpError(409, 'This material changed. Reload before saving.');
      const next = current.currentStock.plus(input.delta);
      if (next.lt(current.allocatedStock) || next.lt(0))
        throw new HttpError(409, 'Adjustment cannot reduce stock below allocated or zero.');
      const saved = await tx.material.update({
        where: { id },
        data: { currentStock: next, version: { increment: 1 } },
      });
      await tx.stockMovement.create({
        data: {
          materialId: id,
          type: new Prisma.Decimal(input.delta).gte(0) ? 'RECEIPT' : 'ADJUSTMENT',
          stockDelta: input.delta,
          allocatedDelta: 0,
          balanceAfter: next,
          allocatedAfter: current.allocatedStock,
          note: input.note,
        },
      });
      await projectAudit(tx, actor, 'STOCK_ADJUSTED', 'Material', id);
      return saved;
    });
    return ok(res, material, 'Stock adjusted.');
  },
);
const requestSchema = z
  .object({
    projectId: z.uuid(),
    materialId: z.uuid(),
    quantity: decimal.refine(
      (v) => new Prisma.Decimal(v).gt(0),
      'Quantity must be greater than zero.',
    ),
    requiredDate: z.iso.date().transform((v) => new Date(v + 'T00:00:00Z')),
    purpose: z.string().trim().min(2).max(1000),
    status: z.enum(['DRAFT', 'SUBMITTED']).default('SUBMITTED'),
  })
  .strict();
inventoryRouter.post(
  '/requests',
  requirePermission('MATERIAL_REQUEST_CREATE'),
  async (req, res) => {
    const input = requestSchema.parse(req.body),
      actor = req.identity!;
    const request = await db.$transaction(async (tx) => {
      const project = await accessProject(tx, input.projectId, actor, 'MATERIAL_REQUEST_CREATE');
      if (input.requiredDate < project.startDate || input.requiredDate > project.endDate)
        throw new HttpError(422, 'Required date must fall within project dates.');
      if (
        !(await tx.material.findFirst({
          where: { id: input.materialId, organizationId: actor.organizationId, active: true },
        }))
      )
        throw new HttpError(422, 'Material must belong to your organization.');
      const created = await tx.materialRequest.create({
        data: { ...input, requesterId: actor.id },
        include,
      });
      await projectAudit(tx, actor, 'MATERIAL_REQUEST_CREATED', 'Project', input.projectId);
      return created;
    });
    return ok(res, request, 'Material request created.', 201);
  },
);
inventoryRouter.patch(
  '/requests/:id/status',
  requirePermission('INVENTORY_UPDATE'),
  async (req, res) => {
    const id = z.uuid().parse(req.params.id),
      input = z
        .object({
          status: z.enum(MaterialRequestStatus),
          decisionNote: z.string().trim().max(1000),
          version: z.number().int().positive(),
        })
        .strict()
        .parse(req.body),
      actor = req.identity!;
    const transitions: Record<MaterialRequestStatus, MaterialRequestStatus[]> = {
      DRAFT: ['SUBMITTED'],
      SUBMITTED: ['APPROVED', 'REJECTED'],
      APPROVED: ['ALLOCATED', 'REJECTED'],
      REJECTED: [],
      ALLOCATED: ['FULFILLED', 'APPROVED'],
      FULFILLED: [],
    };
    const result = await db.$transaction(async (tx) => {
      const current = await tx.materialRequest.findFirst({
        where: { id, project: { organizationId: actor.organizationId } },
        include: { material: true },
      });
      if (!current) throw new HttpError(404, 'Material request not found.');
      await tx.$queryRaw`SELECT id FROM materials WHERE id=${current.materialId}::uuid FOR UPDATE`;
      if (current.version !== input.version)
        throw new HttpError(409, 'This request changed. Reload before saving.');
      if (!transitions[current.status].includes(input.status))
        throw new HttpError(409, 'This request status transition is not allowed.');
      let stockDelta = new Prisma.Decimal(0),
        allocatedDelta = new Prisma.Decimal(0);
      if (input.status === 'ALLOCATED') {
        const available = current.material.currentStock.minus(current.material.allocatedStock);
        if (available.lt(current.quantity))
          throw new HttpError(409, 'Insufficient available stock for this allocation.');
        allocatedDelta = current.quantity;
      }
      if (current.status === 'ALLOCATED' && input.status === 'APPROVED')
        allocatedDelta = current.quantity.neg();
      if (input.status === 'FULFILLED') {
        stockDelta = current.quantity.neg();
        allocatedDelta = current.quantity.neg();
      }
      const balance = current.material.currentStock.plus(stockDelta),
        allocated = current.material.allocatedStock.plus(allocatedDelta);
      if (balance.lt(0) || allocated.lt(0) || allocated.gt(balance))
        throw new HttpError(409, 'Stock would become invalid. Reload and try again.');
      if (!stockDelta.eq(0) || !allocatedDelta.eq(0)) {
        await tx.material.update({
          where: { id: current.materialId },
          data: { currentStock: balance, allocatedStock: allocated, version: { increment: 1 } },
        });
        await tx.stockMovement.create({
          data: {
            materialId: current.materialId,
            requestId: id,
            type:
              input.status === 'ALLOCATED'
                ? 'ALLOCATION'
                : input.status === 'FULFILLED'
                  ? 'ISSUE'
                  : 'RELEASE',
            stockDelta,
            allocatedDelta,
            balanceAfter: balance,
            allocatedAfter: allocated,
            note: input.decisionNote || `Request ${input.status.toLowerCase()}`,
          },
        });
      }
      const saved = await tx.materialRequest.update({
        where: { id },
        data: {
          status: input.status,
          decisionNote: input.decisionNote,
          approvedById: ['APPROVED', 'ALLOCATED', 'FULFILLED'].includes(input.status)
            ? actor.id
            : current.approvedById,
          version: { increment: 1 },
        },
        include,
      });
      await projectAudit(
        tx,
        actor,
        `MATERIAL_REQUEST_${input.status}`,
        'Project',
        current.projectId,
      );
      return saved;
    });
    return ok(res, result, 'Material request updated.');
  },
);

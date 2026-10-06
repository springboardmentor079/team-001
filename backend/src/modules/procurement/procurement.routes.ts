import { Router } from 'express';
import { InvoiceStatus, Prisma, ProcurementRequestStatus, VendorStatus } from '@prisma/client';
import { z } from 'zod';
import { db } from '../../shared/db';
import { HttpError, ok } from '../../shared/http';
import { authenticate, requirePermission } from '../auth/auth.middleware';
import { accessProject, projectAudit, projectScope } from '../projects/project-access';

export const procurementRouter = Router();
procurementRouter.use(authenticate, requirePermission('PROCUREMENT_VIEW'));
const text = (max: number) => z.string().trim().min(1).max(max);
const date = z.iso.date().transform((value) => new Date(`${value}T00:00:00Z`));
const money = z.string().regex(/^\d{1,13}(\.\d{1,2})?$/);
const quantity = z.string().regex(/^\d{1,11}(\.\d{1,3})?$/).refine((value) => new Prisma.Decimal(value).gt(0), 'Quantity must be greater than zero.');
const requestInclude = {
  project: { select: { id: true, name: true } },
  material: { select: { id: true, name: true, unit: true } },
  requester: { select: { id: true, name: true } },
  approvedBy: { select: { id: true, name: true } },
};
const orderInclude = {
  vendor: { select: { id: true, name: true, code: true } },
  material: { select: { id: true, name: true, unit: true } },
  request: { include: { project: { select: { id: true, name: true } } } },
  receipts: { orderBy: { receivedAt: 'desc' as const } },
  invoices: { orderBy: { invoiceDate: 'desc' as const } },
};

procurementRouter.get('/', async (req, res) => {
  const actor = req.identity!, projectWhere = projectScope(actor);
  const [vendors, requests, orders] = await Promise.all([
    db.vendor.findMany({ where: { organizationId: actor.organizationId }, orderBy: { name: 'asc' } }),
    db.procurementRequest.findMany({ where: { project: projectWhere }, include: requestInclude, orderBy: { createdAt: 'desc' } }),
    db.purchaseOrder.findMany({ where: { organizationId: actor.organizationId, request: { project: projectWhere } }, include: orderInclude, orderBy: { createdAt: 'desc' } }),
  ]);
  return ok(res, {
    vendors,
    requests,
    orders,
    summary: {
      vendors: vendors.filter((vendor) => vendor.status === 'ACTIVE').length,
      pendingApprovals: requests.filter((request) => request.status === 'SUBMITTED').length,
      openOrders: orders.filter((order) => ['ISSUED', 'PARTIALLY_RECEIVED'].includes(order.status)).length,
      committed: orders.filter((order) => order.status !== 'CANCELLED').reduce((sum, order) => sum.plus(order.total), new Prisma.Decimal(0)),
    },
  });
});

const vendorSchema = z.object({
  code: text(40).regex(/^[A-Z0-9-]+$/), name: text(160), contactName: z.string().trim().max(150).default(''),
  email: z.union([z.email(), z.literal('')]).default(''), phone: z.string().trim().max(30).default(''),
  address: z.string().trim().max(500).default(''), status: z.enum(VendorStatus).default('ACTIVE'),
}).strict();
procurementRouter.post('/vendors', requirePermission('PO_CREATE'), async (req, res) => {
  const input = vendorSchema.parse(req.body), actor = req.identity!;
  const vendor = await db.$transaction(async (tx) => {
    const created = await tx.vendor.create({ data: { ...input, organizationId: actor.organizationId } });
    await projectAudit(tx, actor, 'VENDOR_CREATED', 'Vendor', created.id);
    return created;
  });
  return ok(res, vendor, 'Vendor created.', 201);
});

const requestSchema = z.object({
  projectId: z.uuid(), materialId: z.uuid(), quantity, requiredDate: date,
  justification: text(2000), status: z.enum(['DRAFT', 'SUBMITTED']).default('SUBMITTED'),
}).strict();
procurementRouter.post('/requests', requirePermission('PROCUREMENT_REQUEST'), async (req, res) => {
  const input = requestSchema.parse(req.body), actor = req.identity!;
  const record = await db.$transaction(async (tx) => {
    const project = await accessProject(tx, input.projectId, actor, 'PROCUREMENT_REQUEST');
    if (input.requiredDate < project.startDate || input.requiredDate > project.endDate) throw new HttpError(422, 'Required date must fall within project dates.');
    if (!(await tx.material.findFirst({ where: { id: input.materialId, organizationId: actor.organizationId, active: true } }))) throw new HttpError(422, 'Material must belong to your organization.');
    const created = await tx.procurementRequest.create({ data: { ...input, requesterId: actor.id }, include: requestInclude });
    await projectAudit(tx, actor, 'PROCUREMENT_REQUEST_CREATED', 'Project', input.projectId);
    return created;
  });
  return ok(res, record, 'Procurement request created.', 201);
});

procurementRouter.patch('/requests/:id/status', async (req, res) => {
  const id = z.uuid().parse(req.params.id), input = z.object({ status: z.enum(ProcurementRequestStatus), decisionNote: z.string().trim().max(1000), version: z.number().int().positive() }).strict().parse(req.body), actor = req.identity!;
  const record = await db.$transaction(async (tx) => {
    const current = await tx.procurementRequest.findFirst({ where: { id, project: { organizationId: actor.organizationId } } });
    if (!current) throw new HttpError(404, 'Procurement request not found.');
    const ownDraftSubmission = current.requesterId === actor.id && current.status === 'DRAFT' && input.status === 'SUBMITTED';
    if (!ownDraftSubmission) {
      await accessProject(tx, current.projectId, actor, 'PO_APPROVE', true);
      if (!(current.status === 'SUBMITTED' && ['APPROVED', 'REJECTED'].includes(input.status))) throw new HttpError(409, 'This procurement request transition is not allowed.');
    }
    if (current.version !== input.version) throw new HttpError(409, 'This procurement request changed. Reload before saving.');
    const saved = await tx.procurementRequest.update({ where: { id }, data: { status: input.status, decisionNote: input.decisionNote, approvedById: input.status === 'APPROVED' ? actor.id : null, version: { increment: 1 } }, include: requestInclude });
    await projectAudit(tx, actor, `PROCUREMENT_REQUEST_${input.status}`, 'Project', current.projectId);
    return saved;
  });
  return ok(res, record, 'Procurement request updated.');
});

const orderSchema = z.object({
  requestId: z.uuid(), vendorId: z.uuid(), number: text(40).regex(/^[A-Z0-9-]+$/),
  unitPrice: money, taxRate: z.string().regex(/^\d{1,3}(\.\d{1,2})?$/).refine((value) => new Prisma.Decimal(value).lte(100), 'Tax rate cannot exceed 100%.'),
  expectedDate: date, notes: z.string().trim().max(2000).default(''),
}).strict();
procurementRouter.post('/orders', requirePermission('PO_CREATE'), async (req, res) => {
  const input = orderSchema.parse(req.body), actor = req.identity!;
  const order = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM procurement_requests WHERE id=${input.requestId}::uuid FOR UPDATE`;
    const request = await tx.procurementRequest.findFirst({ where: { id: input.requestId, project: { organizationId: actor.organizationId } } });
    if (!request) throw new HttpError(404, 'Procurement request not found.');
    await accessProject(tx, request.projectId, actor, 'PO_CREATE', true);
    if (request.status !== 'APPROVED') throw new HttpError(409, 'Approve the procurement request before creating an order.');
    const vendor = await tx.vendor.findFirst({ where: { id: input.vendorId, organizationId: actor.organizationId, status: 'ACTIVE' } });
    if (!vendor) throw new HttpError(422, 'Select an active vendor from your organization.');
    if (input.expectedDate < new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z')) throw new HttpError(422, 'Expected date cannot be in the past.');
    const unitPrice = new Prisma.Decimal(input.unitPrice), taxRate = new Prisma.Decimal(input.taxRate);
    const subtotal = request.quantity.mul(unitPrice).toDecimalPlaces(2), taxAmount = subtotal.mul(taxRate).div(100).toDecimalPlaces(2), total = subtotal.plus(taxAmount);
    const created = await tx.purchaseOrder.create({ data: { organizationId: actor.organizationId, requestId: request.id, vendorId: vendor.id, materialId: request.materialId, number: input.number, quantity: request.quantity, unitPrice, taxRate, subtotal, taxAmount, total, expectedDate: input.expectedDate, notes: input.notes, createdById: actor.id }, include: orderInclude });
    await tx.procurementRequest.update({ where: { id: request.id }, data: { status: 'ORDERED', version: { increment: 1 } } });
    await projectAudit(tx, actor, 'PURCHASE_ORDER_CREATED', 'Project', request.projectId);
    return created;
  });
  return ok(res, order, 'Purchase order issued.', 201);
});

const receiptSchema = z.object({ receiptNumber: text(50).regex(/^[A-Z0-9-]+$/), idempotencyKey: z.uuid(), quantity, receivedAt: z.iso.datetime({ offset: true }).transform((value) => new Date(value)), note: z.string().trim().max(1000).default('') }).strict();
procurementRouter.post('/orders/:id/receipts', requirePermission('PO_CREATE'), async (req, res) => {
  const id = z.uuid().parse(req.params.id), input = receiptSchema.parse(req.body), actor = req.identity!;
  const result = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM organizations WHERE id=${actor.organizationId}::uuid FOR UPDATE`;
    const replay = await tx.goodsReceipt.findFirst({ where: { organizationId: actor.organizationId, idempotencyKey: input.idempotencyKey }, include: { purchaseOrder: true } });
    if (replay) {
      if (replay.purchaseOrderId !== id) throw new HttpError(409, 'Idempotency key was already used for another order.');
      return { receipt: replay, replayed: true };
    }
    await tx.$queryRaw`SELECT id FROM purchase_orders WHERE id=${id}::uuid FOR UPDATE`;
    const order = await tx.purchaseOrder.findFirst({ where: { id, organizationId: actor.organizationId }, include: { request: true, material: true } });
    if (!order) throw new HttpError(404, 'Purchase order not found.');
    await accessProject(tx, order.request.projectId, actor, 'PO_CREATE', true);
    if (!['ISSUED', 'PARTIALLY_RECEIVED'].includes(order.status)) throw new HttpError(409, 'This purchase order cannot receive more material.');
    const nextReceived = order.receivedQuantity.plus(input.quantity);
    if (nextReceived.gt(order.quantity)) throw new HttpError(409, 'Receipt quantity exceeds the remaining purchase order quantity.');
    await tx.$queryRaw`SELECT id FROM materials WHERE id=${order.materialId}::uuid FOR UPDATE`;
    const material = await tx.material.findUniqueOrThrow({ where: { id: order.materialId } });
    const balance = material.currentStock.plus(input.quantity);
    const receipt = await tx.goodsReceipt.create({ data: { ...input, organizationId: actor.organizationId, purchaseOrderId: id, createdById: actor.id } });
    await tx.material.update({ where: { id: material.id }, data: { currentStock: balance, version: { increment: 1 } } });
    await tx.stockMovement.create({ data: { materialId: material.id, procurementReceiptId: receipt.id, type: 'RECEIPT', stockDelta: input.quantity, allocatedDelta: 0, balanceAfter: balance, allocatedAfter: material.allocatedStock, note: `PO ${order.number} / receipt ${input.receiptNumber}` } });
    await tx.purchaseOrder.update({ where: { id }, data: { receivedQuantity: nextReceived, status: nextReceived.eq(order.quantity) ? 'RECEIVED' : 'PARTIALLY_RECEIVED', version: { increment: 1 } } });
    await projectAudit(tx, actor, 'GOODS_RECEIVED', 'Project', order.request.projectId);
    return { receipt, replayed: false };
  });
  return ok(res, result.receipt, result.replayed ? 'Receipt already recorded.' : 'Goods receipt recorded.', result.replayed ? 200 : 201);
});

const invoiceSchema = z.object({ purchaseOrderId: z.uuid(), invoiceNumber: text(60), invoiceDate: date, dueDate: date, amount: money, notes: z.string().trim().max(1000).default('') }).strict().refine((value) => value.dueDate >= value.invoiceDate, { path: ['dueDate'], message: 'Due date must be on or after invoice date.' });
procurementRouter.post('/invoices', requirePermission('PO_CREATE'), async (req, res) => {
  const input = invoiceSchema.parse(req.body), actor = req.identity!;
  const invoice = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM purchase_orders WHERE id=${input.purchaseOrderId}::uuid FOR UPDATE`;
    const order = await tx.purchaseOrder.findFirst({ where: { id: input.purchaseOrderId, organizationId: actor.organizationId }, include: { request: true, invoices: true } });
    if (!order) throw new HttpError(404, 'Purchase order not found.');
    await accessProject(tx, order.request.projectId, actor, 'PO_CREATE', true);
    const amount = new Prisma.Decimal(input.amount), invoiced = order.invoices.reduce((sum, row) => sum.plus(row.amount), new Prisma.Decimal(0));
    if (invoiced.plus(amount).gt(order.total)) throw new HttpError(409, 'Invoice total exceeds the purchase order total.');
    const created = await tx.invoice.create({ data: { ...input, amount, organizationId: actor.organizationId, vendorId: order.vendorId } });
    await projectAudit(tx, actor, 'INVOICE_RECORDED', 'Project', order.request.projectId);
    return created;
  });
  return ok(res, invoice, 'Invoice recorded.', 201);
});
procurementRouter.patch('/invoices/:id/status', requirePermission('PO_APPROVE'), async (req, res) => {
  const id = z.uuid().parse(req.params.id), input = z.object({ status: z.enum(InvoiceStatus), version: z.number().int().positive() }).strict().parse(req.body), actor = req.identity!;
  const transitions: Record<InvoiceStatus, InvoiceStatus[]> = { SUBMITTED: ['VERIFIED', 'DISPUTED'], VERIFIED: ['PAID', 'DISPUTED'], PAID: [], DISPUTED: ['SUBMITTED'] };
  const invoice = await db.$transaction(async (tx) => {
    const current = await tx.invoice.findFirst({ where: { id, organizationId: actor.organizationId }, include: { purchaseOrder: { include: { request: true } } } });
    if (!current) throw new HttpError(404, 'Invoice not found.');
    await accessProject(tx, current.purchaseOrder.request.projectId, actor, 'PO_APPROVE', true);
    if (current.version !== input.version) throw new HttpError(409, 'This invoice changed. Reload before saving.');
    if (!transitions[current.status].includes(input.status)) throw new HttpError(409, 'This invoice status transition is not allowed.');
    const saved = await tx.invoice.update({ where: { id }, data: { status: input.status, version: { increment: 1 } } });
    await projectAudit(tx, actor, `INVOICE_${input.status}`, 'Project', current.purchaseOrder.request.projectId);
    return saved;
  });
  return ok(res, invoice, 'Invoice updated.');
});

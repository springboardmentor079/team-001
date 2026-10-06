import { Router } from 'express';
import { ExpenseStatus, Prisma } from '@prisma/client';
import { z } from 'zod';
import { db } from '../../shared/db';
import { HttpError, ok } from '../../shared/http';
import { authenticate, requirePermission } from '../auth/auth.middleware';
import { accessProject, projectAudit, projectScope } from '../projects/project-access';

export const financeRouter = Router();
financeRouter.use(authenticate, requirePermission('BUDGET_VIEW'));
const text = (max: number) => z.string().trim().min(1).max(max);
const money = z.string().regex(/^\d{1,13}(\.\d{1,2})?$/);
const day = z.iso.date().transform((value) => new Date(`${value}T00:00:00Z`));
const expenseInclude = {
  project: { select: { id: true, name: true } },
  vendor: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
  approvedBy: { select: { id: true, name: true } },
};

financeRouter.get('/', async (req, res) => {
  const actor = req.identity!;
  const projects = await db.project.findMany({
    where: projectScope(actor),
    include: {
      budgetAllocations: { orderBy: { category: 'asc' } },
      expenses: { include: { vendor: { select: { id: true, name: true } }, createdBy: { select: { id: true, name: true } } }, orderBy: { expenseDate: 'desc' } },
      procurementRequests: { include: { purchaseOrder: { include: { invoices: true } } } },
    },
    orderBy: { name: 'asc' },
  });
  const records = projects.map((project) => {
    const orders = project.procurementRequests.flatMap((request) => request.purchaseOrder ? [request.purchaseOrder] : []);
    const paidInvoices = orders.flatMap((order) => order.invoices).filter((invoice) => invoice.status === 'PAID').reduce((sum, invoice) => sum.plus(invoice.amount), new Prisma.Decimal(0));
    const approvedExpenses = project.expenses.filter((expense) => ['APPROVED', 'PAID'].includes(expense.status)).reduce((sum, expense) => sum.plus(expense.amount), new Prisma.Decimal(0));
    const grossCommitment = orders.filter((order) => order.status !== 'CANCELLED').reduce((sum, order) => sum.plus(order.total), new Prisma.Decimal(0));
    const commitment = Prisma.Decimal.max(grossCommitment.minus(paidInvoices), 0);
    const actual = approvedExpenses.plus(paidInvoices), forecast = actual.plus(commitment), remaining = project.budget.minus(forecast);
    return {
      id: project.id, code: project.code, name: project.name, status: project.status,
      budget: project.budget, estimatedCost: project.estimatedCost,
      allocated: project.budgetAllocations.reduce((sum, row) => sum.plus(row.amount), new Prisma.Decimal(0)),
      actual, commitment, forecast, remaining,
      utilization: project.budget.gt(0) ? forecast.div(project.budget).mul(100).toDecimalPlaces(1) : new Prisma.Decimal(0),
      allocations: project.budgetAllocations, expenses: project.expenses,
    };
  });
  return ok(res, {
    projects: records,
    summary: {
      budget: records.reduce((sum, row) => sum.plus(row.budget), new Prisma.Decimal(0)),
      actual: records.reduce((sum, row) => sum.plus(row.actual), new Prisma.Decimal(0)),
      committed: records.reduce((sum, row) => sum.plus(row.commitment), new Prisma.Decimal(0)),
      forecast: records.reduce((sum, row) => sum.plus(row.forecast), new Prisma.Decimal(0)),
      overBudget: records.filter((row) => row.remaining.lt(0)).length,
    },
  });
});

const allocationSchema = z.object({ projectId: z.uuid(), category: text(100), amount: money, notes: z.string().trim().max(1000).default('') }).strict();
financeRouter.post('/budgets', requirePermission('BUDGET_EDIT'), async (req, res) => {
  const input = allocationSchema.parse(req.body), actor = req.identity!;
  const allocation = await db.$transaction(async (tx) => {
    const project = await accessProject(tx, input.projectId, actor, 'BUDGET_EDIT', true);
    const allocated = await tx.budgetAllocation.aggregate({ where: { projectId: project.id }, _sum: { amount: true } });
    if ((allocated._sum.amount || new Prisma.Decimal(0)).plus(input.amount).gt(project.budget)) throw new HttpError(409, 'Category allocations cannot exceed the project budget.');
    const created = await tx.budgetAllocation.create({ data: input });
    await projectAudit(tx, actor, 'BUDGET_ALLOCATED', 'Project', project.id);
    return created;
  });
  return ok(res, allocation, 'Budget allocation created.', 201);
});
financeRouter.patch('/budgets/:id', requirePermission('BUDGET_EDIT'), async (req, res) => {
  const id = z.uuid().parse(req.params.id), input = z.object({ amount: money, notes: z.string().trim().max(1000), version: z.number().int().positive() }).strict().parse(req.body), actor = req.identity!;
  const allocation = await db.$transaction(async (tx) => {
    const current = await tx.budgetAllocation.findFirst({ where: { id, project: { organizationId: actor.organizationId } }, include: { project: true } });
    if (!current) throw new HttpError(404, 'Budget allocation not found.');
    await accessProject(tx, current.projectId, actor, 'BUDGET_EDIT', true);
    if (current.version !== input.version) throw new HttpError(409, 'This budget allocation changed. Reload before saving.');
    const others = await tx.budgetAllocation.aggregate({ where: { projectId: current.projectId, id: { not: id } }, _sum: { amount: true } });
    if ((others._sum.amount || new Prisma.Decimal(0)).plus(input.amount).gt(current.project.budget)) throw new HttpError(409, 'Category allocations cannot exceed the project budget.');
    const saved = await tx.budgetAllocation.update({ where: { id }, data: { amount: input.amount, notes: input.notes, version: { increment: 1 } } });
    await projectAudit(tx, actor, 'BUDGET_ALLOCATION_UPDATED', 'Project', current.projectId);
    return saved;
  });
  return ok(res, allocation, 'Budget allocation updated.');
});

const expenseSchema = z.object({ projectId: z.uuid(), vendorId: z.uuid().nullable(), category: text(100), description: text(1000), amount: money, currency: z.string().length(3).transform((value) => value.toUpperCase()), expenseDate: day, sourceRef: z.string().trim().max(100).nullable(), notes: z.string().trim().max(1000).default('') }).strict();
financeRouter.post('/expenses', requirePermission('EXPENSE_CREATE'), async (req, res) => {
  const input = expenseSchema.parse(req.body), actor = req.identity!;
  const expense = await db.$transaction(async (tx) => {
    const project = await accessProject(tx, input.projectId, actor, 'EXPENSE_CREATE', true);
    if (input.currency !== actor.organization.currency) throw new HttpError(422, `Expenses must use organization currency ${actor.organization.currency}.`);
    if (input.expenseDate < project.startDate || input.expenseDate > new Date()) throw new HttpError(422, 'Expense date must be within the project and cannot be in the future.');
    if (input.vendorId && !(await tx.vendor.findFirst({ where: { id: input.vendorId, organizationId: actor.organizationId } }))) throw new HttpError(422, 'Vendor must belong to your organization.');
    const created = await tx.expense.create({ data: { ...input, sourceRef: input.sourceRef || null, organizationId: actor.organizationId, createdById: actor.id }, include: expenseInclude });
    await projectAudit(tx, actor, 'EXPENSE_CREATED', 'Project', project.id);
    return created;
  });
  return ok(res, expense, 'Expense submitted.', 201);
});
financeRouter.patch('/expenses/:id/status', requirePermission('BUDGET_EDIT'), async (req, res) => {
  const id = z.uuid().parse(req.params.id), input = z.object({ status: z.enum(ExpenseStatus), version: z.number().int().positive() }).strict().parse(req.body), actor = req.identity!;
  const transitions: Record<ExpenseStatus, ExpenseStatus[]> = { SUBMITTED: ['APPROVED', 'REJECTED'], APPROVED: ['PAID'], REJECTED: [], PAID: [] };
  const expense = await db.$transaction(async (tx) => {
    const current = await tx.expense.findFirst({ where: { id, organizationId: actor.organizationId } });
    if (!current) throw new HttpError(404, 'Expense not found.');
    await accessProject(tx, current.projectId, actor, 'BUDGET_EDIT', true);
    if (current.version !== input.version) throw new HttpError(409, 'This expense changed. Reload before saving.');
    if (!transitions[current.status].includes(input.status)) throw new HttpError(409, 'This expense status transition is not allowed.');
    const saved = await tx.expense.update({ where: { id }, data: { status: input.status, approvedById: ['APPROVED', 'PAID'].includes(input.status) ? actor.id : null, version: { increment: 1 } }, include: expenseInclude });
    await projectAudit(tx, actor, `EXPENSE_${input.status}`, 'Project', current.projectId);
    return saved;
  });
  return ok(res, expense, 'Expense updated.');
});

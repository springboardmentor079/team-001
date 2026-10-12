import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { db } from '../../shared/db';
import { HttpError, ok } from '../../shared/http';
import { authenticate, requirePermission } from '../auth/auth.middleware';
import { accessProject, projectScope, scheduleSummary } from '../projects/project-access';
import { rolePermissions } from '../../shared/permissions';

export const analyticsRouter = Router();
analyticsRouter.use(authenticate, requirePermission('REPORT_VIEW'));

const querySchema = z
  .object({
    start: z.iso.date().optional(),
    end: z.iso.date().optional(),
    projectId: z.uuid().optional(),
    interval: z.enum(['week', 'month']).default('month'),
    status: z
      .enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'DELAYED', 'COMPLETED', 'CLOSED', 'CANCELLED'])
      .optional(),
  })
  .refine((value) => !value.start || !value.end || value.start <= value.end, {
    message: 'Start date must be on or before end date.',
    path: ['start'],
  });

const dayMs = 86_400_000;
const isoDate = (date: Date) => date.toISOString().slice(0, 10);
const asUtcDate = (value: string) => new Date(`${value}T00:00:00.000Z`);

function startOfBucket(date: Date, interval: 'week' | 'month') {
  const result = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  if (interval === 'month') result.setUTCDate(1);
  else result.setUTCDate(result.getUTCDate() - ((result.getUTCDay() + 6) % 7));
  return result;
}

function bucketKeys(start: Date, end: Date, interval: 'week' | 'month') {
  const values: string[] = [];
  const cursor = startOfBucket(start, interval);
  while (cursor <= end && values.length < 120) {
    values.push(isoDate(cursor));
    if (interval === 'month') cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    else cursor.setUTCDate(cursor.getUTCDate() + 7);
  }
  return values;
}

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
const percentage = (part: number, whole: number) =>
  whole > 0 ? Number(((part / whole) * 100).toFixed(1)) : null;

analyticsRouter.get('/', async (req, res) => {
  const actor = req.identity!;
  const parsed = querySchema.parse(req.query);
  const today = new Date();
  const end = parsed.end ? asUtcDate(parsed.end) : today;
  const defaultStart = new Date(Date.UTC(end.getUTCFullYear() - 1, end.getUTCMonth(), 1));
  const start = parsed.start ? asUtcDate(parsed.start) : defaultStart;
  if (end.getTime() - start.getTime() > 5 * 366 * dayMs)
    throw new HttpError(422, 'Choose a reporting range of five years or less.');

  const where: Prisma.ProjectWhereInput = {
    ...projectScope(actor),
    ...(parsed.projectId ? { id: parsed.projectId } : {}),
    ...(parsed.status ? { status: parsed.status } : {}),
  };
  const projects = await db.project.findMany({
    where,
    include: {
      workItems: true,
      delays: { where: { status: { not: 'RESOLVED' } } },
      inspections: { where: { resolved: false } },
      siteReports: {
        where: { reportDate: { gte: start, lte: end } },
        orderBy: { reportDate: 'asc' },
      },
      expenses: {
        where: { status: { in: ['APPROVED', 'PAID'] }, expenseDate: { lte: end } },
      },
      procurementRequests: {
        where: { createdAt: { lte: new Date(end.getTime() + dayMs - 1) } },
        include: {
          purchaseOrder: {
            include: { invoices: true, receipts: { orderBy: { receivedAt: 'asc' } } },
          },
        },
      },
      attendance: { where: { approved: true, workDate: { gte: start, lte: end } } },
    },
    orderBy: { name: 'asc' },
  });
  if (parsed.projectId && projects.length === 0)
    throw new HttpError(404, 'Project not found or not available to this account.');

  const projectIds = projects.map((project) => project.id);
  const canInventory = rolePermissions[actor.role].includes('INVENTORY_VIEW');
  const canEquipment = rolePermissions[actor.role].includes('RESOURCE_VIEW');
  const canProcurement = rolePermissions[actor.role].includes('PROCUREMENT_VIEW');
  const canBudget = rolePermissions[actor.role].includes('BUDGET_VIEW');
  const [materials, equipment, allocations] = await Promise.all([
    canInventory
      ? db.material.findMany({ where: { organizationId: actor.organizationId, active: true } })
      : [],
    canEquipment
      ? db.equipment.findMany({ where: { organizationId: actor.organizationId, active: true } })
      : [],
    canEquipment && projectIds.length
      ? db.equipmentAllocation.findMany({
          where: { projectId: { in: projectIds }, startAt: { lte: end }, endAt: { gte: start } },
        })
      : [],
  ]);

  const records = projects.map((project) => {
    const schedule = scheduleSummary(project.workItems);
    const orders = project.procurementRequests.flatMap((row) =>
      row.purchaseOrder ? [row.purchaseOrder] : [],
    );
    const paidInvoiceRows = orders
      .flatMap((order) => order.invoices)
      .filter((row) => row.status === 'PAID' && row.invoiceDate <= end);
    const paidInvoices = paidInvoiceRows.reduce(
      (total, row) => total.plus(row.amount),
      new Prisma.Decimal(0),
    );
    const expenseActual = project.expenses.reduce(
      (total, row) => total.plus(row.amount),
      new Prisma.Decimal(0),
    );
    const commitment = Prisma.Decimal.max(
      orders
        .filter((row) => row.status !== 'CANCELLED')
        .reduce((total, row) => total.plus(row.total), new Prisma.Decimal(0))
        .minus(paidInvoices),
      0,
    );
    const actual = expenseActual.plus(paidInvoices);
    const forecast = actual.plus(commitment);
    const criticalDelays = project.delays.filter((row) => row.critical).length;
    const failedInspections = project.inspections.filter((row) =>
      ['FAILED', 'CONDITIONAL'].includes(row.result),
    ).length;
    const riskScore = Math.min(
      100,
      schedule.overdue * 12 +
        criticalDelays * 25 +
        failedInspections * 20 +
        (canBudget && project.budget.gt(0) && forecast.div(project.budget).gte(0.9) ? 20 : 0),
    );
    return {
      id: project.id,
      code: project.code,
      name: project.name,
      status: project.status,
      progress: schedule.progress,
      overdue: schedule.overdue,
      openDelays: project.delays.length,
      criticalDelays,
      unresolvedInspections: project.inspections.length,
      approvedHours: project.attendance.reduce(
        (total, row) => total.plus(row.hours),
        new Prisma.Decimal(0),
      ),
      budget: project.budget,
      actual,
      commitment,
      forecast,
      budgetUtilization: project.budget.gt(0)
        ? actual.div(project.budget).mul(100).toDecimalPlaces(1)
        : new Prisma.Decimal(0),
      exposureUtilization: project.budget.gt(0)
        ? forecast.div(project.budget).mul(100).toDecimalPlaces(1)
        : new Prisma.Decimal(0),
      riskScore,
      insight:
        riskScore >= 50
          ? 'Immediate review recommended'
          : riskScore >= 20
            ? 'Monitor current exceptions'
            : 'Controls are within configured thresholds',
      trend: project.siteReports.map((report) => ({
        date: report.reportDate,
        progress: report.reportedProgress,
        workers: report.workersPresent,
      })),
      procurementRequests: project.procurementRequests,
      expenses: project.expenses,
      paidInvoices: paidInvoiceRows,
    };
  });

  const budget = sum(records.map((record) => Number(record.budget)));
  const actual = sum(records.map((record) => Number(record.actual)));
  const commitment = sum(records.map((record) => Number(record.commitment)));
  const keys = bucketKeys(start, end, parsed.interval);
  const bucket = (date: Date) => isoDate(startOfBucket(date, parsed.interval));
  const periodSpend = new Map(keys.map((key) => [key, 0]));
  let openingSpend = 0;
  for (const record of records) {
    for (const expense of record.expenses) {
      if (expense.expenseDate < start) openingSpend += Number(expense.amount);
      else {
        const key = bucket(expense.expenseDate);
        periodSpend.set(key, (periodSpend.get(key) || 0) + Number(expense.amount));
      }
    }
    for (const invoice of record.paidInvoices) {
      if (invoice.invoiceDate < start) openingSpend += Number(invoice.amount);
      else {
        const key = bucket(invoice.invoiceDate);
        periodSpend.set(key, (periodSpend.get(key) || 0) + Number(invoice.amount));
      }
    }
  }
  let cumulativeSpend = openingSpend;
  const budgetTrend = keys.map((key) => {
    cumulativeSpend += periodSpend.get(key) || 0;
    return { date: key, actual: Number(cumulativeSpend.toFixed(2)), budget };
  });

  const reportsByBucket = new Map<string, { progress: number[]; workers: number[] }>();
  const attendanceByBucket = new Map<string, { workers: Set<string>; hours: number }>();
  for (const project of projects) {
    for (const report of project.siteReports) {
      const key = bucket(report.reportDate);
      const point = reportsByBucket.get(key) || { progress: [], workers: [] };
      point.progress.push(report.reportedProgress);
      point.workers.push(report.workersPresent);
      reportsByBucket.set(key, point);
    }
    for (const attendance of project.attendance) {
      const key = bucket(attendance.workDate);
      const point = attendanceByBucket.get(key) || { workers: new Set<string>(), hours: 0 };
      if (['PRESENT', 'HALF_DAY'].includes(attendance.status))
        point.workers.add(attendance.workerId);
      point.hours += Number(attendance.hours);
      attendanceByBucket.set(key, point);
    }
  }
  const completionTrend = keys.map((key) => {
    const point = reportsByBucket.get(key);
    return {
      date: key,
      progress: point?.progress.length
        ? Number((sum(point.progress) / point.progress.length).toFixed(1))
        : null,
      observations: point?.progress.length || 0,
    };
  });
  const workforceTrend = keys.map((key) => {
    const point = attendanceByBucket.get(key);
    return { date: key, workers: point?.workers.size || 0, approvedHours: point?.hours || 0 };
  });

  const equipmentTrend = keys.map((key, index) => {
    const bucketStart = asUtcDate(key);
    const next = keys[index + 1]
      ? asUtcDate(keys[index + 1]!)
      : new Date(
          Math.min(
            end.getTime() + dayMs,
            bucketStart.getTime() + (parsed.interval === 'week' ? 7 : 31) * dayMs,
          ),
        );
    const days = Math.max(1, (next.getTime() - bucketStart.getTime()) / dayMs);
    const allocatedDays = allocations.reduce((total, allocation) => {
      const allocationEnd =
        allocation.releasedAt && allocation.releasedAt < allocation.endAt
          ? allocation.releasedAt
          : allocation.endAt;
      const overlapStart = Math.max(bucketStart.getTime(), allocation.startAt.getTime());
      const overlapEnd = Math.min(next.getTime(), allocationEnd.getTime());
      return total + Math.max(0, (overlapEnd - overlapStart) / dayMs);
    }, 0);
    return {
      date: key,
      utilization: equipment.length
        ? Number(((allocatedDays / (equipment.length * days)) * 100).toFixed(1))
        : null,
    };
  });

  const procurementStatuses = new Map<string, number>();
  const procurementByBucket = new Map(
    keys.map((key) => [key, { requests: 0, ordered: 0, spending: 0 }]),
  );
  let pendingProcurement = 0;
  let overdueDeliveries = 0;
  let deliveredOnTime = 0;
  let deliveredLate = 0;
  for (const project of projects) {
    for (const request of project.procurementRequests) {
      procurementStatuses.set(request.status, (procurementStatuses.get(request.status) || 0) + 1);
      if (['SUBMITTED', 'APPROVED'].includes(request.status)) pendingProcurement += 1;
      if (request.createdAt >= start) {
        const point = procurementByBucket.get(bucket(request.createdAt));
        if (point) point.requests += 1;
      }
      const order = request.purchaseOrder;
      if (!order || order.status === 'CANCELLED') continue;
      if (order.createdAt >= start) {
        const point = procurementByBucket.get(bucket(order.createdAt));
        if (point) {
          point.ordered += 1;
          point.spending += Number(order.total);
        }
      }
      const finalReceipt = order.receipts.at(-1)?.receivedAt;
      if (order.status === 'RECEIVED' && finalReceipt) {
        if (finalReceipt <= order.expectedDate) deliveredOnTime += 1;
        else deliveredLate += 1;
      } else if (order.expectedDate < end) overdueDeliveries += 1;
    }
  }

  const activeStatuses = new Set(['PLANNING', 'ACTIVE', 'ON_HOLD', 'DELAYED']);
  const utilizedEquipment = equipment.filter((item) =>
    ['IN_USE', 'RESERVED'].includes(item.status),
  ).length;
  const lowStock = materials.filter((material) =>
    material.currentStock.minus(material.allocatedStock).lte(material.minimumLevel),
  ).length;
  const statusDistribution = [...new Set(projects.map((project) => project.status))].map(
    (status) => ({
      label: status,
      value: projects.filter((project) => project.status === status).length,
    }),
  );
  const equipmentDistribution = canEquipment
    ? [...new Set(equipment.map((item) => item.status))].map((status) => ({
        label: status,
        value: equipment.filter((item) => item.status === status).length,
      }))
    : null;
  const projectBars = records.map((record) => ({
    id: record.id,
    label: record.name,
    status: record.status,
    progress: record.progress,
    risk: record.riskScore,
    budget: canBudget ? Number(record.budget) : null,
    actual: canBudget ? Number(record.actual) : null,
  }));

  const insights: {
    severity: string;
    type: string;
    projectId: string | null;
    project: string | null;
    metric: string;
    message: string;
    source: string;
    asOf: Date;
  }[] = [];
  for (const record of records) {
    if (record.overdue > 0)
      insights.push({
        severity: record.overdue >= 3 ? 'HIGH' : 'MEDIUM',
        type: 'RULE_BASED',
        projectId: record.id,
        project: record.name,
        metric: `${record.overdue} overdue schedule item(s)`,
        message: `${record.name} has incomplete work past its planned date.`,
        source: 'Saved work-item status and planned dates',
        asOf: end,
      });
    if (canBudget && Number(record.exposureUtilization) >= 90)
      insights.push({
        severity: Number(record.exposureUtilization) > 100 ? 'HIGH' : 'MEDIUM',
        type: 'RULE_BASED',
        projectId: record.id,
        project: record.name,
        metric: `${Number(record.exposureUtilization).toFixed(1)}% budget exposure`,
        message: `${record.name} has actual expenditure plus commitments at or above 90% of budget.`,
        source: 'Approved/paid expenses, paid invoices and open purchase-order commitments',
        asOf: end,
      });
  }
  if (overdueDeliveries > 0)
    insights.push({
      severity: 'HIGH',
      type: 'RULE_BASED',
      projectId: null,
      project: null,
      metric: `${overdueDeliveries} overdue delivery order(s)`,
      message: 'Open purchase orders have passed their expected delivery date.',
      source: 'Purchase-order expected dates and receipt status',
      asOf: end,
    });

  return ok(res, {
    generatedAt: new Date(),
    reporting: {
      start: isoDate(start),
      end: isoDate(end),
      interval: parsed.interval,
      timezone: actor.organization.timezone,
      currency: actor.organization.currency,
      projectId: parsed.projectId || null,
      status: parsed.status || null,
    },
    filters: { projects: projects.map(({ id, code, name }) => ({ id, code, name })) },
    projects: records.map(
      ({
        procurementRequests: _requests,
        expenses: _expenses,
        paidInvoices: _invoices,
        ...record
      }) => ({
        ...record,
        budget: canBudget ? record.budget : null,
        actual: canBudget ? record.actual : null,
        commitment: canBudget ? record.commitment : null,
        forecast: canBudget ? record.forecast : null,
        budgetUtilization: canBudget ? record.budgetUtilization : null,
        exposureUtilization: canBudget ? record.exposureUtilization : null,
      }),
    ),
    summary: {
      projects: records.length,
      activeProjects: projects.filter((project) => activeStatuses.has(project.status)).length,
      completedProjects: projects.filter((project) =>
        ['COMPLETED', 'CLOSED'].includes(project.status),
      ).length,
      averageProgress: records.length
        ? Math.round(sum(records.map((record) => record.progress)) / records.length)
        : 0,
      atRisk: records.filter((record) => record.riskScore >= 50).length,
      overdueItems: sum(records.map((record) => record.overdue)),
      lowStock: canInventory ? lowStock : null,
      budget: canBudget ? budget.toFixed(2) : null,
      actual: canBudget ? actual.toFixed(2) : null,
      remaining: canBudget ? (budget - actual).toFixed(2) : null,
      commitment: canBudget ? commitment.toFixed(2) : null,
      budgetUtilization: canBudget ? percentage(actual, budget) : null,
      resourceUtilization: canEquipment ? percentage(utilizedEquipment, equipment.length) : null,
      pendingProcurement: canProcurement ? pendingProcurement : null,
      overdueDeliveries: canProcurement ? overdueDeliveries : null,
    },
    charts: {
      budgetTrend: canBudget ? budgetTrend : null,
      completionTrend,
      workforceTrend,
      equipmentTrend: canEquipment ? equipmentTrend : null,
      procurementTrend: canProcurement
        ? keys.map((key) => ({ date: key, ...procurementByBucket.get(key)! }))
        : null,
      projectPerformance: projectBars,
      statusDistribution,
      equipmentDistribution,
      procurementDistribution: canProcurement
        ? [...procurementStatuses].map(([label, value]) => ({ label, value }))
        : null,
      deliveryDistribution: canProcurement
        ? [
            { label: 'ON_TIME', value: deliveredOnTime },
            { label: 'LATE', value: deliveredLate },
            { label: 'OVERDUE', value: overdueDeliveries },
          ].filter((item) => item.value > 0)
        : null,
    },
    insights: insights.slice(0, 12),
    predictiveReadiness: {
      operationalPredictionsDisplayed: false,
      reason:
        'Existing models have in-sample diagnostics only. Probabilities are withheld here until project-level or time-based holdout validation and calibration are available.',
      location: '/ml-insights',
    },
    methodology: {
      progress:
        'Current completion is the weighted average of saved milestone percentages; tasks are used only when a project has no milestones. Trend points are recorded site-report observations, and missing periods remain missing.',
      risk: 'Rule-based risk: 12 points per overdue item, 25 per critical delay, 20 per unresolved failed/conditional inspection, and 20 when financial exposure reaches 90% of budget; capped at 100.',
      finance:
        'Actual = approved/paid expenses + paid invoices, counted once. Commitment = non-cancelled purchase-order total − paid invoices. Budget utilisation uses actual ÷ approved project budget.',
      resources:
        'Current resource utilisation = active equipment marked IN_USE or RESERVED ÷ all active equipment. Trend utilisation uses allocation overlap days ÷ available equipment-days.',
      procurement:
        'A delivery is overdue when an open non-cancelled order is past its expected date. A received order is on time when its final recorded receipt is on or before the expected date.',
    },
  });
});

analyticsRouter.get('/projects/:id/weather', async (req, res) => {
  const id = z.uuid().parse(req.params.id);
  const actor = req.identity!;
  const project = await db.$transaction((tx) => accessProject(tx, id, actor, 'REPORT_VIEW'));
  return ok(res, {
    live: false,
    provider: 'DEMO',
    label: 'Demonstration weather — not live',
    location: `${project.city}, ${project.state}`,
    observedAt: null,
    condition: 'Partly cloudy',
    temperatureC: 29,
    rainChancePercent: 20,
    note: 'Configure a weather provider and credentials before operational use.',
  });
});

analyticsRouter.get('/projects/:id/camera-feeds', async (req, res) => {
  const id = z.uuid().parse(req.params.id);
  const actor = req.identity!;
  const project = await db.$transaction((tx) => accessProject(tx, id, actor, 'REPORT_VIEW'));
  return ok(res, {
    live: false,
    provider: 'UNCONFIGURED',
    label: 'Camera feeds are not configured',
    project: { id: project.id, name: project.name },
    feeds: [],
    note: 'No image or stream is simulated. Configure an authorized camera provider to enable feeds.',
  });
});

import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { db } from '../../shared/db';
import { ok } from '../../shared/http';
import { authenticate, requirePermission } from '../auth/auth.middleware';
import { accessProject, projectScope, scheduleSummary } from '../projects/project-access';
import { rolePermissions } from '../../shared/permissions';

export const analyticsRouter = Router();
analyticsRouter.use(authenticate, requirePermission('REPORT_VIEW'));
analyticsRouter.get('/', async (req, res) => {
  const actor = req.identity!, where = projectScope(actor);
  const projects = await db.project.findMany({
    where,
    include: {
      workItems: true,
      delays: { where: { status: { not: 'RESOLVED' } } },
      inspections: { where: { resolved: false } },
      siteReports: { orderBy: { reportDate: 'asc' } },
      expenses: { where: { status: { in: ['APPROVED', 'PAID'] } } },
      procurementRequests: { include: { purchaseOrder: { include: { invoices: true } } } },
      attendance: { where: { approved: true } },
    },
    orderBy: { name: 'asc' },
  });
  const records = projects.map((project) => {
    const schedule = scheduleSummary(project.workItems);
    const orders = project.procurementRequests.flatMap((row) => row.purchaseOrder ? [row.purchaseOrder] : []);
    const paidInvoices = orders.flatMap((order) => order.invoices).filter((row) => row.status === 'PAID').reduce((sum, row) => sum.plus(row.amount), new Prisma.Decimal(0));
    const expenseActual = project.expenses.reduce((sum, row) => sum.plus(row.amount), new Prisma.Decimal(0));
    const commitment = Prisma.Decimal.max(orders.filter((row) => row.status !== 'CANCELLED').reduce((sum, row) => sum.plus(row.total), new Prisma.Decimal(0)).minus(paidInvoices), 0);
    const actual = expenseActual.plus(paidInvoices), forecast = actual.plus(commitment);
    const criticalDelays = project.delays.filter((row) => row.critical).length;
    const failedInspections = project.inspections.filter((row) => ['FAILED', 'CONDITIONAL'].includes(row.result)).length;
    const riskScore = Math.min(100, schedule.overdue * 12 + criticalDelays * 25 + failedInspections * 20 + (project.budget.gt(0) && forecast.div(project.budget).gte(0.9) ? 20 : 0));
    const insight = riskScore >= 50 ? 'Immediate review recommended' : riskScore >= 20 ? 'Monitor current exceptions' : 'Controls are within configured thresholds';
    return {
      id: project.id, code: project.code, name: project.name, status: project.status,
      progress: schedule.progress, overdue: schedule.overdue, openDelays: project.delays.length, criticalDelays, unresolvedInspections: project.inspections.length,
      approvedHours: project.attendance.reduce((sum, row) => sum.plus(row.hours), new Prisma.Decimal(0)),
      budget: project.budget, actual, commitment, forecast,
      budgetUtilization: project.budget.gt(0) ? forecast.div(project.budget).mul(100).toDecimalPlaces(1) : new Prisma.Decimal(0),
      riskScore, insight,
      trend: project.siteReports.map((report) => ({ date: report.reportDate, progress: report.reportedProgress, workers: report.workersPresent })),
    };
  });
  const canInventory = rolePermissions[actor.role].includes('INVENTORY_VIEW');
  const materials = canInventory ? await db.material.findMany({ where: { organizationId: actor.organizationId, active: true } }) : [];
  const lowStock = materials.filter((material) => material.currentStock.minus(material.allocatedStock).lte(material.minimumLevel)).length;
  return ok(res, {
    projects: records,
    summary: {
      projects: records.length,
      averageProgress: records.length ? Math.round(records.reduce((sum, row) => sum + row.progress, 0) / records.length) : 0,
      atRisk: records.filter((row) => row.riskScore >= 50).length,
      overdueItems: records.reduce((sum, row) => sum + row.overdue, 0),
      lowStock: canInventory ? lowStock : null,
      actual: records.reduce((sum, row) => sum.plus(row.actual), new Prisma.Decimal(0)),
      forecast: records.reduce((sum, row) => sum.plus(row.forecast), new Prisma.Decimal(0)),
    },
    methodology: {
      progress: 'Current progress is calculated from saved milestone percentages and their weights; tasks are used only when a project has no milestones. ML predicts delay risk separately and does not overwrite recorded completion.',
      risk: '12 points per overdue item, 25 per critical delay, 20 per unresolved failed/conditional inspection, and 20 when forecast reaches 90% of budget; capped at 100.',
      finance: 'Actual = approved/paid expenses + paid invoices. Outstanding commitment = non-cancelled PO total − paid invoices. Forecast = actual + outstanding commitment.',
    },
  });
});
analyticsRouter.get('/projects/:id/weather', async (req, res) => {
  const id = z.uuid().parse(req.params.id), actor = req.identity!;
  const project = await db.$transaction((tx) => accessProject(tx, id, actor, 'REPORT_VIEW'));
  return ok(res, { live: false, provider: 'DEMO', label: 'Demonstration weather — not live', location: `${project.city}, ${project.state}`, observedAt: null, condition: 'Partly cloudy', temperatureC: 29, rainChancePercent: 20, note: 'Configure a weather provider and credentials before operational use.' });
});
analyticsRouter.get('/projects/:id/camera-feeds', async (req, res) => {
  const id = z.uuid().parse(req.params.id), actor = req.identity!;
  const project = await db.$transaction((tx) => accessProject(tx, id, actor, 'REPORT_VIEW'));
  return ok(res, { live: false, provider: 'UNCONFIGURED', label: 'Camera feeds are not configured', project: { id: project.id, name: project.name }, feeds: [], note: 'No image or stream is simulated. Configure an authorized camera provider to enable feeds.' });
});

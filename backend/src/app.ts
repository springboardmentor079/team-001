import express from 'express';
import { Prisma } from '@prisma/client';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { db } from './shared/db';
import { errors, HttpError, ok } from './shared/http';
import { authRouter } from './modules/auth/auth.routes';
import { authenticate } from './modules/auth/auth.middleware';
import { scheduleRouter } from './modules/projects/schedule.routes';
import { siteRouter } from './modules/projects/site.routes';
import { projectsRouter } from './modules/projects/projects.routes';
import { equipmentRouter } from './modules/equipment/equipment.routes';
import { inventoryRouter } from './modules/inventory/inventory.routes';
import { workforceRouter } from './modules/workforce/workforce.routes';
import { procurementRouter } from './modules/procurement/procurement.routes';
import { financeRouter } from './modules/finance/finance.routes';
import { documentsRouter } from './modules/documents/documents.routes';
import { notificationsRouter } from './modules/notifications/notifications.routes';
import { reportsRouter } from './modules/reports/reports.routes';
import { analyticsRouter } from './modules/analytics/analytics.routes';
import { assistantRouter } from './modules/assistant/assistant.routes';
import { mlRouter } from './modules/ml/ml.routes';
import { searchRouter } from './modules/search/search.routes';
import { usersRouter } from './modules/users/users.routes';
import { apiDocument } from './openapi';
import { projectScope, scheduleSummary } from './modules/projects/project-access';
import { rolePermissions } from './shared/permissions';

export const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(
  cors({
    origin: env.APP_ORIGIN,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-BuildTrack-Client'],
  }),
);
app.use(express.json({ limit: '32kb' }));
app.use(cookieParser());
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
app.get('/api/health', (_req, res) => ok(res, { status: 'ok', service: 'BuildTrack API' }));
app.get('/api/ready', async (_req, res) => {
  await db.$queryRaw`SELECT 1`;
  return ok(res, { status: 'ready' });
});
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(apiDocument));
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.NODE_ENV === 'test' ? 1000 : env.NODE_ENV === 'development' ? 300 : 60,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again later.', errors: [] },
});
const assistantLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: env.NODE_ENV === 'test' ? 1000 : 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Assistant request limit reached. Please wait a moment.',
    errors: [],
  },
});
app.use('/api/v1/auth', limiter, authRouter);
app.get('/api/v1/account/overview', authenticate, async (req, res) => {
  const user = req.identity!;
  const permissions = rolePermissions[user.role];
  const canViewProjects = permissions.includes('PROJECT_VIEW');
  const canViewBudget = permissions.includes('BUDGET_VIEW');
  const canViewWorkforce = permissions.includes('WORKFORCE_VIEW');
  const canViewEquipment = permissions.includes('RESOURCE_VIEW');
  const [sessions, activity, projects, activeWorkforce, equipment] = await Promise.all([
    db.authSession.count({
      where: { userId: user.id, revokedAt: null, expiresAt: { gt: new Date() } },
    }),
    db.auditLog.findMany({
      where: { organizationId: user.organizationId, actorId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: { id: true, action: true, createdAt: true },
    }),
    canViewProjects
      ? db.project.findMany({
          where: projectScope(user),
          include: {
            workItems: { orderBy: { plannedDate: 'asc' } },
            siteReports: { orderBy: { reportDate: 'asc' }, take: 24 },
            delays: { where: { status: { not: 'RESOLVED' } } },
            inspections: { where: { resolved: false } },
            members: {
              include: { user: { select: { id: true, name: true, role: true } } },
            },
          },
          orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
        })
      : Promise.resolve([]),
    canViewWorkforce
      ? db.workerProfile.count({
          where: { organizationId: user.organizationId, active: true, status: 'ACTIVE' },
        })
      : Promise.resolve(null),
    canViewEquipment
      ? db.equipment.findMany({
          where: { organizationId: user.organizationId, active: true },
          include: {
            maintenance: {
              where: { status: { in: ['SCHEDULED', 'IN_PROGRESS'] } },
              orderBy: { scheduledAt: 'asc' },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  const projectIds = projects.map((project) => project.id);
  const [financialProjects, siteActivity] = await Promise.all([
    canViewBudget && projectIds.length
      ? db.project.findMany({
          where: { id: { in: projectIds } },
          include: {
            expenses: { where: { status: { in: ['APPROVED', 'PAID'] } } },
            procurementRequests: {
              include: { purchaseOrder: { include: { invoices: true } } },
            },
          },
        })
      : Promise.resolve([]),
    projectIds.length
      ? db.auditLog.findMany({
          where: { organizationId: user.organizationId, entityId: { in: projectIds } },
          include: { actor: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 8,
        })
      : Promise.resolve([]),
  ]);
  const financialByProject = new Map(
    financialProjects.map((project) => {
      const orders = project.procurementRequests.flatMap((request) =>
        request.purchaseOrder ? [request.purchaseOrder] : [],
      );
      const paidInvoices = orders
        .flatMap((order) => order.invoices)
        .filter((invoice) => invoice.status === 'PAID')
        .reduce((sum, invoice) => sum.plus(invoice.amount), new Prisma.Decimal(0));
      const actual = project.expenses
        .reduce((sum, expense) => sum.plus(expense.amount), new Prisma.Decimal(0))
        .plus(paidInvoices);
      const grossCommitment = orders
        .filter((order) => order.status !== 'CANCELLED')
        .reduce((sum, order) => sum.plus(order.total), new Prisma.Decimal(0));
      const commitment = Prisma.Decimal.max(grossCommitment.minus(paidInvoices), 0);
      return [project.id, { actual, commitment, forecast: actual.plus(commitment) }] as const;
    }),
  );
  const operationalProjects = projects.map((project) => {
    const schedule = scheduleSummary(project.workItems);
    const finance = financialByProject.get(project.id);
    const criticalDelays = project.delays.filter((delay) => delay.critical).length;
    const failedInspections = project.inspections.filter((inspection) =>
      ['FAILED', 'CONDITIONAL'].includes(inspection.result),
    ).length;
    const budgetRisk =
      finance && project.budget.gt(0) && finance.forecast.div(project.budget).gte(0.9) ? 20 : 0;
    const riskScore = Math.min(
      100,
      schedule.overdue * 12 + criticalDelays * 25 + failedInspections * 20 + budgetRisk,
    );
    return {
      id: project.id,
      code: project.code,
      name: project.name,
      city: project.city,
      state: project.state,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
      progress: schedule.progress,
      overdue: schedule.overdue,
      riskScore,
      manager:
        project.members.find((member) => member.user.role === 'PROJECT_MANAGER')?.user.name || null,
      budgetUtilization:
        finance && project.budget.gt(0)
          ? finance.forecast.div(project.budget).mul(100).toDecimalPlaces(1)
          : null,
      milestones: project.workItems
        .filter((item) => item.kind === 'MILESTONE')
        .slice(0, 5)
        .map((item) => ({
          id: item.id,
          name: item.name,
          plannedDate: item.plannedDate,
          status: item.status,
          progress: item.progress,
        })),
    };
  });
  const totalBudget = projects.reduce(
    (sum, project) => sum.plus(project.budget),
    new Prisma.Decimal(0),
  );
  const totalForecast = [...financialByProject.values()].reduce(
    (sum, finance) => sum.plus(finance.forecast),
    new Prisma.Decimal(0),
  );
  const safetyAlerts = projects.reduce(
    (sum, project) =>
      sum +
      project.delays.filter((delay) => delay.critical).length +
      project.inspections.filter((inspection) =>
        ['FAILED', 'CONDITIONAL'].includes(inspection.result),
      ).length,
    0,
  );
  const progressByDate = new Map<string, number[]>();
  for (const project of projects) {
    for (const report of project.siteReports) {
      const date = report.reportDate.toISOString().slice(0, 10);
      progressByDate.set(date, [...(progressByDate.get(date) || []), report.reportedProgress]);
    }
  }
  const maintenanceAlerts = equipment
    .flatMap((item) =>
      item.maintenance
        .filter((record) => ['HIGH', 'CRITICAL'].includes(record.priority))
        .map((record) => ({
          id: record.id,
          equipment: item.name,
          type: record.type,
          priority: record.priority,
          status: record.status,
          scheduledAt: record.scheduledAt,
        })),
    )
    .slice(0, 4);
  return ok(res, {
    sessions,
    activity,
    organization: user.organization,
    role: user.role,
    memberSince: user.createdAt,
    operations: {
      sourceLabel: 'Recorded workspace data',
      generatedAt: new Date(),
      summary: {
        activeProjects: operationalProjects.filter((project) => project.status === 'ACTIVE').length,
        activeWorkforce,
        budgetUtilization:
          canViewBudget && totalBudget.gt(0)
            ? totalForecast.div(totalBudget).mul(100).toDecimalPlaces(1)
            : null,
        healthyProjects: operationalProjects.filter((project) => project.riskScore < 20).length,
        atRiskProjects: operationalProjects.filter((project) => project.riskScore >= 50).length,
        safetyAlerts,
        maintenanceAlerts: maintenanceAlerts.length,
      },
      projects: operationalProjects,
      analytics: {
        statusDistribution: [...new Set(operationalProjects.map((project) => project.status))].map(
          (status) => ({
            label: status,
            value: operationalProjects.filter((project) => project.status === status).length,
          }),
        ),
        projectPerformance: operationalProjects.map((project) => ({
          label: project.name,
          progress: project.progress,
          risk: project.riskScore,
        })),
        progressTrend: [...progressByDate.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, values]) => ({
            date,
            progress: Number(
              (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1),
            ),
            observations: values.length,
          })),
      },
      activity: siteActivity.map((item) => ({
        id: item.id,
        action: item.action,
        actor: item.actor?.name || 'System',
        projectId: item.entityId,
        projectName:
          operationalProjects.find((project) => project.id === item.entityId)?.name || 'Project',
        createdAt: item.createdAt,
      })),
      maintenanceAlerts,
    },
  });
});
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/projects/:projectId/schedule', scheduleRouter);
app.use('/api/v1/projects/:projectId/site', siteRouter);
app.use('/api/v1/projects', projectsRouter);
app.use('/api/v1/equipment', equipmentRouter);
app.use('/api/v1/inventory', inventoryRouter);
app.use('/api/v1/workforce', workforceRouter);
app.use('/api/v1/procurement', procurementRouter);
app.use('/api/v1/finance', financeRouter);
app.use('/api/v1/documents', documentsRouter);
app.use('/api/v1/notifications', notificationsRouter);
app.use('/api/v1/reports', reportsRouter);
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1/assistant', assistantLimiter, assistantRouter);
app.use('/api/v1/ml', mlRouter);
app.use('/api/v1/search', searchRouter);
app.use((_req, _res) => {
  throw new HttpError(404, 'The requested endpoint does not exist.');
});
app.use(errors);

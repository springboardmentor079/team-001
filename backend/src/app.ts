import express from 'express';
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
import { usersRouter } from './modules/users/users.routes';
import { apiDocument } from './openapi';

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
  message: { success: false, message: 'Assistant request limit reached. Please wait a moment.', errors: [] },
});
app.use('/api/v1/auth', limiter, authRouter);
app.get('/api/v1/account/overview', authenticate, async (req, res) => {
  const user = req.identity!;
  const [sessions, activity] = await Promise.all([
    db.authSession.count({
      where: { userId: user.id, revokedAt: null, expiresAt: { gt: new Date() } },
    }),
    db.auditLog.findMany({
      where: { organizationId: user.organizationId, actorId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: { id: true, action: true, createdAt: true },
    }),
  ]);
  return ok(res, {
    sessions,
    activity,
    organization: user.organization,
    role: user.role,
    memberSince: user.createdAt,
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
app.use((_req, _res) => {
  throw new HttpError(404, 'The requested endpoint does not exist.');
});
app.use(errors);

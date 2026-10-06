import { Router } from 'express';
import { z } from 'zod';
import { db } from '../../shared/db';
import { HttpError, ok } from '../../shared/http';
import { authenticate } from '../auth/auth.middleware';

export const notificationsRouter = Router();
notificationsRouter.use(authenticate);
notificationsRouter.get('/', async (req, res) => {
  const actor = req.identity!;
  const records = await db.notification.findMany({ where: { userId: actor.id, organizationId: actor.organizationId }, orderBy: { createdAt: 'desc' }, take: 100 });
  return ok(res, { records, unread: records.filter((record) => !record.readAt).length });
});
notificationsRouter.patch('/:id/read', async (req, res) => {
  const id = z.uuid().parse(req.params.id), actor = req.identity!;
  const current = await db.notification.findFirst({ where: { id, userId: actor.id, organizationId: actor.organizationId } });
  if (!current) throw new HttpError(404, 'Notification not found.');
  const saved = await db.notification.update({ where: { id }, data: { readAt: current.readAt || new Date() } });
  return ok(res, saved, 'Notification marked as read.');
});
notificationsRouter.post('/read-all', async (req, res) => {
  const actor = req.identity!;
  const result = await db.notification.updateMany({ where: { userId: actor.id, organizationId: actor.organizationId, readAt: null }, data: { readAt: new Date() } });
  return ok(res, { updated: result.count }, 'Notifications marked as read.');
});

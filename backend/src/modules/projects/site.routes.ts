import { Router } from 'express';
import { DelayStatus, InspectionResult } from '@prisma/client';
import { z } from 'zod';
import { db } from '../../shared/db';
import { HttpError, ok } from '../../shared/http';
import { authenticate } from '../auth/auth.middleware';
import { accessProject, projectAudit } from './project-access';

export const siteRouter = Router({ mergeParams: true });
siteRouter.use(authenticate);
const projectParam = (params: object) =>
  z.uuid().parse((params as Record<string, string>).projectId);
const date = z.iso.date().transform((value) => new Date(value + 'T00:00:00Z'));
const detail = z.string().trim().max(5000).default('');
const reportSchema = z
  .object({
    reportDate: date,
    weather: z.string().trim().min(1).max(150),
    workersPresent: z.number().int().min(0).max(100000),
    workCompleted: z.string().trim().min(2).max(5000),
    reportedProgress: z.number().int().min(0).max(100),
    materialsUsed: detail,
    equipmentUsed: detail,
    safetyObservations: detail,
    issues: detail,
    notes: detail,
    version: z.number().int().positive().optional(),
  })
  .strict();
function validateDate(value: Date, start: Date) {
  if (value < start || value.toISOString().slice(0, 10) > new Date().toISOString().slice(0, 10))
    throw new HttpError(
      422,
      'Site record date must be on or after project start and no later than today.',
    );
}
siteRouter.get('/', async (req, res) => {
  const projectId = projectParam(req.params);
  await accessProject(db, projectId, req.identity!, 'SITE_REPORT_VIEW');
  const [reports, delays, inspections, activity] = await Promise.all([
    db.siteReport.findMany({
      where: { projectId },
      include: { author: { select: { name: true } } },
      orderBy: { reportDate: 'desc' },
    }),
    db.siteDelay.findMany({
      where: { projectId },
      include: { reporter: { select: { name: true } }, workItem: { select: { name: true } } },
      orderBy: { date: 'desc' },
    }),
    db.inspection.findMany({
      where: { projectId },
      include: { inspector: { select: { name: true } } },
      orderBy: { date: 'desc' },
    }),
    db.auditLog.findMany({
      where: {
        organizationId: req.identity!.organizationId,
        entity: 'Project',
        entityId: projectId,
      },
      select: { id: true, action: true, createdAt: true, actor: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
  ]);
  const weeks = new Map<
    string,
    {
      week: string;
      reports: number;
      workerObservations: number;
      lastReportedProgress: number;
      lastDate: string;
    }
  >();
  for (const report of reports) {
    const monday = new Date(report.reportDate);
    monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
    const week = monday.toISOString().slice(0, 10);
    const row = weeks.get(week) || {
      week,
      reports: 0,
      workerObservations: 0,
      lastReportedProgress: report.reportedProgress,
      lastDate: report.reportDate.toISOString().slice(0, 10),
    };
    row.reports++;
    row.workerObservations += report.workersPresent;
    weeks.set(week, row);
  }
  return ok(res, { reports, delays, inspections, weeks: [...weeks.values()], activity });
});
siteRouter.post('/reports', saveReport(false));
siteRouter.patch('/reports/:id', saveReport(true));
function saveReport(edit: boolean): import('express').RequestHandler {
  return async (req, res) => {
    const projectId = projectParam(req.params);
    const id = edit ? z.uuid().parse(req.params.id) : undefined;
    const { version, ...input } = reportSchema.parse(req.body);
    const actor = req.identity!;
    const report = await db.$transaction(async (tx) => {
      const project = await accessProject(tx, projectId, actor, 'SITE_REPORT_CREATE', true);
      validateDate(input.reportDate, project.startDate);
      const existing = id ? await tx.siteReport.findFirst({ where: { id, projectId } }) : null;
      if (id && !existing) throw new HttpError(404, 'Report not found.');
      if (existing && actor.role !== 'ADMINISTRATOR' && existing.authorId !== actor.id)
        throw new HttpError(403, 'Only the author or an administrator can correct a daily report.');
      if (existing && version !== existing.version)
        throw new HttpError(409, 'This report changed. Reload before saving.');
      const saved = existing
        ? await tx.siteReport.update({
            where: { id },
            data: { ...input, version: { increment: 1 } },
          })
        : await tx.siteReport.create({ data: { ...input, projectId, authorId: actor.id } });
      await projectAudit(
        tx,
        actor,
        existing ? 'SITE_REPORT_UPDATED' : 'SITE_REPORT_CREATED',
        'Project',
        projectId,
      );
      return saved;
    });
    return ok(res, report, 'Daily report saved.', edit ? 200 : 201);
  };
}
const delaySchema = z
  .object({
    date,
    cause: z.string().trim().min(2).max(500),
    daysDelayed: z.number().int().min(1).max(3650),
    impact: z.string().trim().min(2).max(3000),
    correctiveAction: z.string().trim().max(3000).default(''),
    critical: z.boolean(),
    workItemId: z.uuid().nullable(),
  })
  .strict();
siteRouter.post('/delays', async (req, res) => {
  const projectId = projectParam(req.params);
  const input = delaySchema.parse(req.body);
  const actor = req.identity!;
  const result = await db.$transaction(async (tx) => {
    const project = await accessProject(tx, projectId, actor, 'SITE_REPORT_CREATE', true);
    validateDate(input.date, project.startDate);
    if (
      input.workItemId &&
      !(await tx.workItem.findFirst({ where: { id: input.workItemId, projectId } }))
    )
      throw new HttpError(422, 'The affected schedule item must belong to this project.');
    const saved = await tx.siteDelay.create({
      data: { ...input, projectId, reporterId: actor.id },
    });
    await projectAudit(tx, actor, 'DELAY_REPORTED', 'Project', projectId);
    return saved;
  });
  return ok(res, result, 'Delay reported.', 201);
});
siteRouter.patch('/delays/:id', async (req, res) => {
  const projectId = projectParam(req.params);
  const id = z.uuid().parse(req.params.id);
  const actor = req.identity!;
  const input = z
    .object({
      status: z.enum(DelayStatus),
      correctiveAction: z.string().trim().min(2).max(3000),
      version: z.number().int().positive(),
    })
    .strict()
    .parse(req.body);
  const result = await db.$transaction(async (tx) => {
    await accessProject(tx, projectId, actor, 'SITE_ISSUE_MANAGE', true);
    const current = await tx.siteDelay.findFirst({ where: { id, projectId } });
    if (!current) throw new HttpError(404, 'Delay not found.');
    if (current.version !== input.version)
      throw new HttpError(409, 'This delay changed. Reload before saving.');
    const saved = await tx.siteDelay.update({
      where: { id },
      data: {
        status: input.status,
        correctiveAction: input.correctiveAction,
        version: { increment: 1 },
      },
    });
    await projectAudit(tx, actor, 'DELAY_UPDATED', 'Project', projectId);
    return saved;
  });
  return ok(res, result, 'Delay updated.');
});
siteRouter.post('/inspections', async (req, res) => {
  const projectId = projectParam(req.params);
  const actor = req.identity!;
  const input = z
    .object({
      date,
      location: z.string().trim().min(2).max(300),
      type: z.string().trim().min(2).max(100),
      result: z.enum(InspectionResult),
      findings: z.string().trim().min(2).max(5000),
      correctiveAction: z.string().trim().max(3000).default(''),
    })
    .strict()
    .parse(req.body);
  const result = await db.$transaction(async (tx) => {
    const project = await accessProject(tx, projectId, actor, 'SITE_ISSUE_MANAGE', true);
    validateDate(input.date, project.startDate);
    const saved = await tx.inspection.create({
      data: { ...input, projectId, inspectorId: actor.id, resolved: input.result === 'PASSED' },
    });
    await projectAudit(tx, actor, 'INSPECTION_RECORDED', 'Project', projectId);
    return saved;
  });
  return ok(res, result, 'Inspection recorded.', 201);
});
siteRouter.patch('/inspections/:id', async (req, res) => {
  const projectId = projectParam(req.params);
  const id = z.uuid().parse(req.params.id);
  const actor = req.identity!;
  const input = z
    .object({
      resolved: z.boolean(),
      correctiveAction: z.string().trim().min(2).max(3000),
      version: z.number().int().positive(),
    })
    .strict()
    .parse(req.body);
  const result = await db.$transaction(async (tx) => {
    await accessProject(tx, projectId, actor, 'SITE_ISSUE_MANAGE', true);
    const current = await tx.inspection.findFirst({ where: { id, projectId } });
    if (!current) throw new HttpError(404, 'Inspection not found.');
    if (current.version !== input.version)
      throw new HttpError(409, 'This inspection changed. Reload before saving.');
    const saved = await tx.inspection.update({
      where: { id },
      data: {
        resolved: input.resolved,
        correctiveAction: input.correctiveAction,
        version: { increment: 1 },
      },
    });
    await projectAudit(tx, actor, 'INSPECTION_UPDATED', 'Project', projectId);
    return saved;
  });
  return ok(res, result, 'Inspection updated.');
});

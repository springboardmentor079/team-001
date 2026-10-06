import { Router } from 'express';
import { AttendanceStatus, Prisma, WorkerStatus } from '@prisma/client';
import { z } from 'zod';
import { db } from '../../shared/db';
import { HttpError, ok } from '../../shared/http';
import { authenticate, Identity, requirePermission } from '../auth/auth.middleware';
import { accessProject, projectAudit, projectScope } from '../projects/project-access';

export const workforceRouter = Router();
workforceRouter.use(authenticate, requirePermission('WORKFORCE_VIEW'));
const day = z.iso.date().transform((value) => new Date(`${value}T00:00:00Z`));
const text = (max: number) => z.string().trim().min(1).max(max);
const workerInclude = {
  user: { select: { id: true, name: true, email: true } },
  assignments: {
    include: { project: { select: { id: true, name: true } } },
    orderBy: { startDate: 'desc' as const },
  },
};
function visibleWorkerWhere(actor: Identity): Prisma.WorkerProfileWhereInput {
  if (actor.role === 'WORKER') return { organizationId: actor.organizationId, userId: actor.id };
  if (actor.role === 'ADMINISTRATOR') return { organizationId: actor.organizationId };
  return {
    organizationId: actor.organizationId,
    assignments: { some: { project: projectScope(actor) } },
  };
}
async function activeAssignment(
  tx: Prisma.TransactionClient,
  workerId: string,
  projectId: string,
  date: Date,
) {
  const assignment = await tx.workerProjectAssignment.findFirst({
    where: {
      workerId,
      projectId,
      startDate: { lte: date },
      OR: [{ endDate: null }, { endDate: { gte: date } }],
    },
  });
  if (!assignment) throw new HttpError(409, 'Worker is not assigned to this project on that date.');
  return assignment;
}

workforceRouter.get('/', async (req, res) => {
  const actor = req.identity!;
  const where = visibleWorkerWhere(actor);
  const workers = await db.workerProfile.findMany({ where, include: workerInclude, orderBy: { name: 'asc' } });
  const workerIds = workers.map((worker) => worker.id);
  const [attendance, shifts, approved] = await Promise.all([
    db.attendance.findMany({
      where: { workerId: { in: workerIds } },
      include: { worker: { select: { id: true, name: true } }, project: { select: { id: true, name: true } } },
      orderBy: [{ workDate: 'desc' }, { createdAt: 'desc' }],
      take: 100,
    }),
    db.shift.findMany({
      where: { workerId: { in: workerIds }, endAt: { gte: new Date(Date.now() - 7 * 86400000) } },
      include: { worker: { select: { id: true, name: true } }, project: { select: { id: true, name: true } } },
      orderBy: { startAt: 'asc' },
      take: 100,
    }),
    db.attendance.groupBy({
      by: ['workerId'],
      where: { workerId: { in: workerIds }, approved: true },
      _sum: { hours: true },
    }),
  ]);
  const hours = new Map(approved.map((row) => [row.workerId, row._sum.hours || new Prisma.Decimal(0)]));
  const payroll = workers.map((worker) => {
    const approvedHours = hours.get(worker.id) || new Prisma.Decimal(0);
    return {
      workerId: worker.id,
      worker: worker.name,
      approvedHours,
      hourlyRate: worker.hourlyRate,
      estimatedPay: approvedHours.mul(worker.hourlyRate),
    };
  });
  return ok(res, {
    workers,
    attendance,
    shifts,
    payroll,
    summary: {
      total: workers.length,
      active: workers.filter((worker) => worker.status === 'ACTIVE').length,
      onLeave: workers.filter((worker) => worker.status === 'ON_LEAVE').length,
      approvedHours: payroll.reduce((sum, row) => sum.plus(row.approvedHours), new Prisma.Decimal(0)),
      estimatedPayroll: payroll.reduce((sum, row) => sum.plus(row.estimatedPay), new Prisma.Decimal(0)),
    },
  });
});

const workerSchema = z.object({
  employeeCode: text(40).regex(/^[A-Z0-9-]+$/),
  name: text(150),
  category: text(100),
  phone: z.string().trim().max(30).default(''),
  hourlyRate: z.string().regex(/^\d{1,10}(\.\d{1,2})?$/),
  status: z.enum(WorkerStatus).default('ACTIVE'),
  userId: z.uuid().nullable().default(null),
}).strict();
workforceRouter.post('/workers', requirePermission('WORKER_CREATE'), async (req, res) => {
  const input = workerSchema.parse(req.body), actor = req.identity!;
  if (input.userId && !(await db.user.findFirst({ where: { id: input.userId, organizationId: actor.organizationId, active: true } })))
    throw new HttpError(422, 'Linked account must be an active member of your organization.');
  const worker = await db.$transaction(async (tx) => {
    const created = await tx.workerProfile.create({ data: { ...input, organizationId: actor.organizationId }, include: workerInclude });
    await projectAudit(tx, actor, 'WORKER_CREATED', 'WorkerProfile', created.id);
    return created;
  });
  return ok(res, worker, 'Worker created.', 201);
});
workforceRouter.patch('/workers/:id', requirePermission('WORKER_CREATE'), async (req, res) => {
  const id = z.uuid().parse(req.params.id);
  const { version, ...input } = workerSchema.extend({ version: z.number().int().positive() }).parse(req.body);
  const actor = req.identity!;
  const worker = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM worker_profiles WHERE id=${id}::uuid FOR UPDATE`;
    const current = await tx.workerProfile.findFirst({ where: { id, organizationId: actor.organizationId } });
    if (!current) throw new HttpError(404, 'Worker not found.');
    if (current.version !== version) throw new HttpError(409, 'This worker changed. Reload before saving.');
    if (input.userId && !(await tx.user.findFirst({ where: { id: input.userId, organizationId: actor.organizationId, active: true } })))
      throw new HttpError(422, 'Linked account must be an active member of your organization.');
    const saved = await tx.workerProfile.update({ where: { id }, data: { ...input, version: { increment: 1 } }, include: workerInclude });
    await projectAudit(tx, actor, 'WORKER_UPDATED', 'WorkerProfile', id);
    return saved;
  });
  return ok(res, worker, 'Worker updated.');
});

const assignmentSchema = z.object({
  projectId: z.uuid(),
  startDate: day,
  endDate: day.nullable(),
  role: text(100),
}).strict().refine((value) => !value.endDate || value.endDate >= value.startDate, { path: ['endDate'], message: 'Assignment end must be on or after its start.' });
workforceRouter.post('/workers/:id/assignments', requirePermission('WORKER_CREATE'), async (req, res) => {
  const workerId = z.uuid().parse(req.params.id), input = assignmentSchema.parse(req.body), actor = req.identity!;
  const assignment = await db.$transaction(async (tx) => {
    const project = await accessProject(tx, input.projectId, actor, 'WORKER_CREATE', true);
    const worker = await tx.workerProfile.findFirst({ where: { id: workerId, organizationId: actor.organizationId, active: true } });
    if (!worker) throw new HttpError(404, 'Worker not found.');
    if (input.startDate < project.startDate || (input.endDate && input.endDate > project.endDate))
      throw new HttpError(422, 'Assignment dates must fall within project dates.');
    const overlap = await tx.workerProjectAssignment.findFirst({ where: { workerId, projectId: input.projectId, startDate: { lte: input.endDate || project.endDate }, OR: [{ endDate: null }, { endDate: { gte: input.startDate } }] } });
    if (overlap) throw new HttpError(409, 'This worker already has an overlapping assignment for the project.');
    const created = await tx.workerProjectAssignment.create({ data: { workerId, ...input }, include: { project: { select: { id: true, name: true } } } });
    await projectAudit(tx, actor, 'WORKER_ASSIGNED', 'Project', input.projectId);
    return created;
  });
  return ok(res, assignment, 'Worker assigned.', 201);
});

const attendanceSchema = z.object({
  workerId: z.uuid(), projectId: z.uuid(), workDate: day,
  status: z.enum(AttendanceStatus),
  hours: z.string().regex(/^\d{1,2}(\.\d{1,2})?$/).refine((value) => new Prisma.Decimal(value).lte(24), 'Hours cannot exceed 24.'),
  approved: z.boolean().default(false), notes: z.string().trim().max(1000).default(''),
}).strict();
workforceRouter.post('/attendance', requirePermission('ATTENDANCE_MANAGE'), async (req, res) => {
  const input = attendanceSchema.parse(req.body), actor = req.identity!;
  if (input.workDate > new Date()) throw new HttpError(422, 'Attendance cannot be recorded for a future date.');
  if (['ABSENT', 'LEAVE'].includes(input.status) && new Prisma.Decimal(input.hours).gt(0))
    throw new HttpError(422, 'Absent or leave attendance must have zero hours.');
  const record = await db.$transaction(async (tx) => {
    await accessProject(tx, input.projectId, actor, 'ATTENDANCE_MANAGE', true);
    await activeAssignment(tx, input.workerId, input.projectId, input.workDate);
    const created = await tx.attendance.create({ data: { ...input, approvedById: input.approved ? actor.id : null } });
    await projectAudit(tx, actor, 'ATTENDANCE_RECORDED', 'Project', input.projectId);
    return created;
  });
  return ok(res, record, 'Attendance recorded.', 201);
});
workforceRouter.patch('/attendance/:id/approval', requirePermission('ATTENDANCE_MANAGE'), async (req, res) => {
  const id = z.uuid().parse(req.params.id), input = z.object({ approved: z.boolean(), version: z.number().int().positive() }).strict().parse(req.body), actor = req.identity!;
  const record = await db.$transaction(async (tx) => {
    const current = await tx.attendance.findFirst({ where: { id, worker: { organizationId: actor.organizationId } } });
    if (!current) throw new HttpError(404, 'Attendance record not found.');
    await accessProject(tx, current.projectId, actor, 'ATTENDANCE_MANAGE', true);
    if (current.version !== input.version) throw new HttpError(409, 'This attendance record changed. Reload before saving.');
    const saved = await tx.attendance.update({ where: { id }, data: { approved: input.approved, approvedById: input.approved ? actor.id : null, version: { increment: 1 } } });
    await projectAudit(tx, actor, input.approved ? 'ATTENDANCE_APPROVED' : 'ATTENDANCE_REOPENED', 'Project', current.projectId);
    return saved;
  });
  return ok(res, record, input.approved ? 'Attendance approved.' : 'Attendance reopened.');
});

const shiftSchema = z.object({
  workerId: z.uuid(), projectId: z.uuid(),
  startAt: z.iso.datetime({ offset: true }).transform((value) => new Date(value)),
  endAt: z.iso.datetime({ offset: true }).transform((value) => new Date(value)),
  location: z.string().trim().max(200).default(''), notes: z.string().trim().max(1000).default(''),
}).strict().refine((value) => value.endAt > value.startAt, { path: ['endAt'], message: 'Shift end must be after its start.' }).refine((value) => value.endAt.getTime() - value.startAt.getTime() <= 24 * 3600000, { path: ['endAt'], message: 'A shift cannot exceed 24 hours.' });
workforceRouter.post('/shifts', requirePermission('SHIFT_MANAGE'), async (req, res) => {
  const input = shiftSchema.parse(req.body), actor = req.identity!;
  const shift = await db.$transaction(async (tx) => {
    const project = await accessProject(tx, input.projectId, actor, 'SHIFT_MANAGE', true);
    const workDate = new Date(input.startAt.toISOString().slice(0, 10) + 'T00:00:00Z');
    if (workDate < project.startDate || workDate > project.endDate) throw new HttpError(422, 'Shift must fall within project dates.');
    await activeAssignment(tx, input.workerId, input.projectId, workDate);
    await tx.$queryRaw`SELECT id FROM worker_profiles WHERE id=${input.workerId}::uuid FOR UPDATE`;
    const overlap = await tx.shift.findFirst({ where: { workerId: input.workerId, startAt: { lt: input.endAt }, endAt: { gt: input.startAt } } });
    if (overlap) throw new HttpError(409, 'This worker already has an overlapping shift.');
    const created = await tx.shift.create({ data: input });
    await projectAudit(tx, actor, 'SHIFT_CREATED', 'Project', input.projectId);
    return created;
  });
  return ok(res, shift, 'Shift scheduled.', 201);
});

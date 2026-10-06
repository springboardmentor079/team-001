import { Router } from 'express';
import { WorkKind, WorkStatus } from '@prisma/client';
import { z } from 'zod';
import { db } from '../../shared/db';
import { HttpError, ok } from '../../shared/http';
import { authenticate } from '../auth/auth.middleware';
import { accessProject, projectAudit, scheduleSummary } from './project-access';

export const scheduleRouter = Router({ mergeParams: true });
scheduleRouter.use(authenticate);
const projectParam = (params: object) =>
  z.uuid().parse((params as Record<string, string>).projectId);
const date = z.iso.date().transform((value) => new Date(value + 'T00:00:00Z'));
const schema = z
  .object({
    kind: z.enum(WorkKind),
    name: z.string().trim().min(2).max(150),
    description: z.string().trim().max(5000).default(''),
    startDate: date,
    plannedDate: date,
    actualDate: date.nullable(),
    status: z.enum(WorkStatus),
    progress: z.number().int().min(0).max(100),
    weight: z.coerce.number().positive().max(10000).multipleOf(0.01).default(1),
    rebaseline: z.boolean().default(false),
    responsibleId: z.uuid().nullable(),
    dependencyId: z.uuid().nullable(),
    version: z.number().int().positive().optional(),
  })
  .strict();
scheduleRouter.get('/', async (req, res) => {
  const projectId = projectParam(req.params);
  await accessProject(db, projectId, req.identity!, 'MILESTONE_VIEW');
  const items = await db.workItem.findMany({
    where: { projectId },
    include: { responsible: { select: { id: true, name: true } } },
    orderBy: [{ plannedDate: 'asc' }, { id: 'asc' }],
  });
  return ok(res, { items, summary: scheduleSummary(items) });
});
scheduleRouter.post('/', save(false));
scheduleRouter.patch('/:id', save(true));
function save(edit: boolean): import('express').RequestHandler {
  return async (req, res) => {
    const projectId = projectParam(req.params);
    const id = edit ? z.uuid().parse(req.params.id) : undefined;
    const { version, rebaseline, ...input } = schema.parse(req.body);
    const actor = req.identity!;
    const item = await db.$transaction(async (tx) => {
      const project = await accessProject(
        tx,
        projectId,
        actor,
        edit ? 'MILESTONE_EDIT' : 'MILESTONE_CREATE',
        true,
      );
      const all = await tx.workItem.findMany({ where: { projectId } });
      const existing = id ? all.find((row) => row.id === id) : undefined;
      if (id && !existing) throw new HttpError(404, 'Schedule item not found.');
      if (existing && version !== existing.version)
        throw new HttpError(409, 'This item changed. Reload before saving.');
      if (
        input.startDate < project.startDate ||
        input.plannedDate > project.endDate ||
        input.plannedDate < input.startDate
      )
        throw new HttpError(422, 'Schedule dates must be ordered and within the project dates.');
      if (
        (input.status === 'COMPLETED') !== (input.progress === 100) ||
        (input.status === 'NOT_STARTED' && input.progress !== 0)
      )
        throw new HttpError(
          422,
          'Completed items must have 100% progress; not-started items must have 0%.',
        );
      if ((input.status === 'COMPLETED') !== (input.actualDate !== null))
        throw new HttpError(422, 'An actual completion date is required only for completed items.');
      if (
        input.actualDate &&
        (input.actualDate < input.startDate ||
          input.actualDate.toISOString().slice(0, 10) > new Date().toISOString().slice(0, 10))
      )
        throw new HttpError(422, 'Actual completion must be between the start date and today.');
      if (
        input.responsibleId &&
        !(await tx.projectMember.findFirst({
          where: { projectId, userId: input.responsibleId, user: { active: true } },
        }))
      )
        throw new HttpError(422, 'Responsible person must be an active assigned project member.');
      const dependency = input.dependencyId
        ? all.find((row) => row.id === input.dependencyId)
        : null;
      if (input.dependencyId && !dependency)
        throw new HttpError(422, 'Dependency must belong to this project.');
      const visited = new Set<string>(id ? [id] : []);
      let next = dependency;
      while (next) {
        if (visited.has(next.id))
          throw new HttpError(422, 'Schedule dependencies cannot form a cycle.');
        visited.add(next.id);
        next = all.find((row) => row.id === next!.dependencyId);
      }
      if (dependency && dependency.plannedDate > input.startDate)
        throw new HttpError(422, 'This item must start on or after its dependency is due.');
      if (dependency && input.progress > 0 && dependency.status !== 'COMPLETED')
        throw new HttpError(409, 'Complete the dependency before recording progress.');
      if (dependency?.actualDate && input.actualDate && dependency.actualDate > input.actualDate)
        throw new HttpError(422, 'Completion cannot precede dependency completion.');
      for (const dependent of all.filter((row) => row.dependencyId === id)) {
        if (
          input.plannedDate > dependent.startDate ||
          (dependent.progress > 0 && input.status !== 'COMPLETED') ||
          (input.actualDate && dependent.actualDate && input.actualDate > dependent.actualDate)
        )
          throw new HttpError(
            409,
            'This change conflicts with a dependent item. Update its schedule/progress first.',
          );
      }
      const baseline =
        !existing || rebaseline
          ? { baselineStartDate: input.startDate, baselinePlannedDate: input.plannedDate }
          : {};
      const saved = existing
        ? await tx.workItem.update({
            where: { id },
            data: { ...input, ...baseline, version: { increment: 1 } },
          })
        : await tx.workItem.create({ data: { ...input, ...baseline, projectId } });
      await projectAudit(
        tx,
        actor,
        existing ? 'SCHEDULE_UPDATED' : 'SCHEDULE_CREATED',
        'WorkItem',
        saved.id,
      );
      if (existing && rebaseline)
        await projectAudit(tx, actor, 'SCHEDULE_BASELINE_REVISED', 'WorkItem', saved.id);
      return saved;
    });
    return ok(
      res,
      item,
      edit ? 'Schedule item updated.' : 'Schedule item created.',
      edit ? 200 : 201,
    );
  };
}

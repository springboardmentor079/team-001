import { Router } from 'express';
import { WorkItem } from '@prisma/client';
import { db } from '../../shared/db';
import { ok } from '../../shared/http';
import { authenticate, requirePermission } from '../auth/auth.middleware';
import { projectScope } from '../projects/project-access';
import { rolePermissions } from '../../shared/permissions';

export const mlRouter = Router();
mlRouter.use(authenticate, requirePermission('REPORT_VIEW'));

export type ScheduleRecord = WorkItem & {
  project: { id: string; code: string; name: string; priority: string };
  delays: { id: string }[];
};
const dayMs = 86_400_000;
export const sigmoid = (value: number) => 1 / (1 + Math.exp(-Math.max(-30, Math.min(30, value))));

export function scheduleFeatures(item: ScheduleRecord) {
  const duration = Math.max(1, Math.round((item.plannedDate.getTime() - item.startDate.getTime()) / dayMs));
  return [
    1,
    Math.min(duration / 180, 2),
    item.dependencyId ? 1 : 0,
    item.kind === 'TASK' ? 1 : 0,
    ['HIGH', 'CRITICAL'].includes(item.project.priority) ? 1 : 0,
    Math.min(item.delays.length / 3, 1),
  ];
}

export function trainBinaryLogistic(samples: { x: number[]; y: number }[], minimum = 12) {
  const positives = samples.filter((sample) => sample.y === 1).length;
  const ready = samples.length >= minimum && positives >= 3 && samples.length - positives >= 3;
  if (!ready)
    return { ready: false as const, samples: samples.length, positives, weights: [] as number[], brier: null };
  const weights = new Array(samples[0]!.x.length).fill(0) as number[];
  const rate = 0.18;
  for (let step = 0; step < 900; step += 1) {
    const gradient = new Array(weights.length).fill(0) as number[];
    for (const sample of samples) {
      const prediction = sigmoid(sample.x.reduce((sum, value, index) => sum + value * weights[index]!, 0));
      sample.x.forEach((value, index) => {
        gradient[index] = gradient[index]! + (prediction - sample.y) * value;
      });
    }
    weights.forEach((weight, index) => {
      const regularization = index === 0 ? 0 : 0.015 * weight;
      weights[index] = weights[index]! - rate * (gradient[index]! / samples.length + regularization);
    });
  }
  const brier = samples.reduce((sum, sample) => {
    const probability = sigmoid(sample.x.reduce((value, feature, index) => value + feature * weights[index]!, 0));
    return sum + (probability - sample.y) ** 2;
  }, 0) / samples.length;
  return { ready: true as const, samples: samples.length, positives, weights, brier };
}

export function trainLogistic(rows: ScheduleRecord[]) {
  const samples = rows
    .filter((row) => row.status === 'COMPLETED' && row.actualDate)
    .map((row) => ({
      x: scheduleFeatures(row),
      y: row.actualDate!.getTime() > row.plannedDate.getTime() ? 1 : 0,
    }));
  return trainBinaryLogistic(samples);
}

function reasonLabels(item: ScheduleRecord) {
  const reasons: string[] = [];
  const duration = Math.max(1, Math.round((item.plannedDate.getTime() - item.startDate.getTime()) / dayMs));
  if (item.delays.length) reasons.push(`${item.delays.length} recorded delay${item.delays.length === 1 ? '' : 's'}`);
  if (item.dependencyId) reasons.push('Depends on another schedule item');
  if (['HIGH', 'CRITICAL'].includes(item.project.priority)) reasons.push(`${item.project.priority.toLowerCase()} project priority`);
  if (duration > 90) reasons.push('Long planned duration');
  return reasons.length ? reasons.slice(0, 3) : ['No dominant risk feature'];
}

function weekStart(date: Date) {
  const copy = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = (copy.getUTCDay() + 6) % 7;
  copy.setUTCDate(copy.getUTCDate() - day);
  return copy.toISOString().slice(0, 10);
}

export function exponentialForecast(values: number[], alpha = 0.45) {
  return values.reduce((forecast, demand, index) =>
    index === 0 ? demand : alpha * demand + (1 - alpha) * forecast, 0);
}

export interface RegressionSample { x: number[]; y: number }
export function trainRidgeRegression(samples: RegressionSample[]) {
  if (samples.length < 10) return { ready: false as const, weights: [] as number[], rmse: null };
  const mean = samples.reduce((sum, sample) => sum + sample.y, 0) / samples.length;
  const variance = samples.reduce((sum, sample) => sum + (sample.y - mean) ** 2, 0) / samples.length;
  if (variance < 0.0025)
    return { ready: false as const, weights: [] as number[], rmse: null };
  const weights = new Array(samples[0]!.x.length).fill(0) as number[];
  const rate = 0.08;
  for (let step = 0; step < 1400; step += 1) {
    const gradient = new Array(weights.length).fill(0) as number[];
    for (const sample of samples) {
      const predicted = sample.x.reduce((sum, value, index) => sum + value * weights[index]!, 0);
      sample.x.forEach((value, index) => {
        gradient[index] = gradient[index]! + 2 * (predicted - sample.y) * value;
      });
    }
    weights.forEach((weight, index) => {
      const regularization = index === 0 ? 0 : 0.02 * weight;
      weights[index] = weights[index]! - rate * (gradient[index]! / samples.length + regularization);
    });
  }
  const rmse = Math.sqrt(samples.reduce((sum, sample) => {
    const predicted = sample.x.reduce((value, feature, index) => value + feature * weights[index]!, 0);
    return sum + (predicted - sample.y) ** 2;
  }, 0) / samples.length);
  return { ready: true as const, weights, rmse };
}

export function costFeatures(input: {
  budget: number; estimatedCost: number; startDate: Date; endDate: Date; priority: string;
}) {
  const durationDays = Math.max(1, (input.endDate.getTime() - input.startDate.getTime()) / dayMs);
  return [
    1,
    Math.min(input.estimatedCost / Math.max(input.budget, 1), 2),
    Math.min(durationDays / 730, 2),
    ['HIGH', 'CRITICAL'].includes(input.priority) ? 1 : 0,
  ];
}

function allocationDays(
  allocations: { startAt: Date; endAt: Date; releasedAt: Date | null }[],
  until: Date,
) {
  const since = new Date(until.getTime() - 90 * dayMs);
  return allocations.reduce((sum, allocation) => {
    const start = new Date(Math.max(since.getTime(), allocation.startAt.getTime()));
    const effectiveEnd = allocation.releasedAt && allocation.releasedAt < allocation.endAt
      ? allocation.releasedAt
      : allocation.endAt;
    const end = new Date(Math.min(until.getTime(), effectiveEnd.getTime()));
    return sum + Math.max(0, (end.getTime() - start.getTime()) / dayMs);
  }, 0);
}

mlRouter.get('/', async (req, res) => {
  const actor = req.identity!;
  const scope = projectScope(actor);
  const workItems = await db.workItem.findMany({
    where: { project: scope },
    include: {
      project: { select: { id: true, code: true, name: true, priority: true } },
      delays: { select: { id: true } },
    },
    orderBy: { plannedDate: 'asc' },
  });
  const model = trainLogistic(workItems);
  const schedulePredictions = model.ready
    ? workItems.filter((item) => item.status !== 'COMPLETED').map((item) => {
        const probability = sigmoid(scheduleFeatures(item).reduce((sum, value, index) => sum + value * model.weights[index]!, 0));
        return {
          id: item.id,
          projectId: item.project.id,
          projectCode: item.project.code,
          projectName: item.project.name,
          name: item.name,
          plannedDate: item.plannedDate,
          probability: Math.round(probability * 100),
          band: probability >= 0.7 ? 'HIGH' : probability >= 0.4 ? 'MEDIUM' : 'LOW',
          reasons: reasonLabels(item),
        };
      }).sort((a, b) => b.probability - a.probability)
    : [];

  const financeProjects = await db.project.findMany({
    where: scope,
    include: {
      expenses: { where: { status: { in: ['APPROVED', 'PAID'] } }, select: { amount: true } },
      procurementRequests: {
        include: { purchaseOrder: { include: { invoices: { select: { amount: true, status: true } } } } },
      },
    },
    orderBy: { name: 'asc' },
  });
  const financialRows = financeProjects.map((project) => {
    const expenseActual = project.expenses.reduce((sum, row) => sum + Number(row.amount), 0);
    const orders = project.procurementRequests.flatMap((row) => row.purchaseOrder ? [row.purchaseOrder] : []);
    const paidInvoices = orders.flatMap((order) => order.invoices).filter((invoice) => invoice.status === 'PAID').reduce((sum, invoice) => sum + Number(invoice.amount), 0);
    const orderTotal = orders.filter((order) => order.status !== 'CANCELLED').reduce((sum, order) => sum + Number(order.total), 0);
    const actual = expenseActual + paidInvoices;
    const commitment = Math.max(0, orderTotal - paidInvoices);
    return { project, actual, commitment, baseline: actual + commitment };
  });
  const costSamples = financialRows.filter(({ project }) => project.status === 'CLOSED' && Number(project.budget) > 0).map(({ project, actual }) => ({
    x: costFeatures({ budget: Number(project.budget), estimatedCost: Number(project.estimatedCost), startDate: project.startDate, endDate: project.endDate, priority: project.priority }),
    y: Math.min(actual / Number(project.budget), 3),
  }));
  const costModel = trainRidgeRegression(costSamples);
  const costPredictions = costModel.ready ? financialRows.filter(({ project }) => !['CLOSED', 'CANCELLED'].includes(project.status)).map(({ project, actual, commitment, baseline }) => {
    const budget = Number(project.budget);
    const ratio = Math.max(0, Math.min(3, costFeatures({ budget, estimatedCost: Number(project.estimatedCost), startDate: project.startDate, endDate: project.endDate, priority: project.priority }).reduce((sum, value, index) => sum + value * costModel.weights[index]!, 0)));
    const modelEstimate = budget * ratio;
    const expectedAtCompletion = Math.max(actual, baseline, modelEstimate);
    const reasons: string[] = [];
    if (Number(project.estimatedCost) / Math.max(budget, 1) >= 0.9) reasons.push('Estimate is at least 90% of budget');
    if ((project.endDate.getTime() - project.startDate.getTime()) / dayMs > 365) reasons.push('Project duration exceeds one year');
    if (['HIGH', 'CRITICAL'].includes(project.priority)) reasons.push(`${project.priority.toLowerCase()} project priority`);
    if (!reasons.length) reasons.push('Historical portfolio cost pattern');
    return {
      id: project.id, code: project.code, name: project.name, budget: budget.toFixed(2), actual: actual.toFixed(2),
      commitment: commitment.toFixed(2), deterministicForecast: baseline.toFixed(2), modelEstimate: modelEstimate.toFixed(2),
      expectedAtCompletion: expectedAtCompletion.toFixed(2),
      expectedVariancePercent: budget > 0 ? Number(((expectedAtCompletion / budget - 1) * 100).toFixed(1)) : 0,
      reasons,
    };
  }).sort((a, b) => b.expectedVariancePercent - a.expectedVariancePercent) : [];

  const canInventory = rolePermissions[actor.role].includes('INVENTORY_VIEW');
  const materials = canInventory
    ? await db.material.findMany({
        where: { organizationId: actor.organizationId, active: true },
        include: { movements: { where: { stockDelta: { lt: 0 } }, orderBy: { createdAt: 'asc' } } },
        orderBy: { name: 'asc' },
      })
    : [];
  const materialForecasts = materials.map((material) => {
    const buckets = new Map<string, number>();
    for (const movement of material.movements) {
      const key = weekStart(movement.createdAt);
      buckets.set(key, (buckets.get(key) || 0) + Math.abs(Number(movement.stockDelta)));
    }
    const weekly = [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-12);
    const alpha = 0.45;
    const forecast = exponentialForecast(weekly.map(([, demand]) => demand), alpha);
    const available = Math.max(0, Number(material.currentStock.minus(material.allocatedStock)));
    const ready = weekly.length >= 2 && forecast > 0;
    const weeksOfCover = ready ? available / forecast : null;
    const stockoutDate = weeksOfCover === null ? null : new Date(Date.now() + weeksOfCover * 7 * dayMs);
    return {
      id: material.id,
      sku: material.sku,
      name: material.name,
      unit: material.unit,
      available: available.toFixed(3),
      weeksObserved: weekly.length,
      expectedWeeklyDemand: ready ? forecast.toFixed(3) : null,
      weeksOfCover: weeksOfCover === null ? null : Number(weeksOfCover.toFixed(1)),
      stockoutDate,
      status: ready ? (weeksOfCover! <= 2 ? 'HIGH' : weeksOfCover! <= 5 ? 'MEDIUM' : 'LOW') : 'INSUFFICIENT_DATA',
    };
  });

  const canEquipment = rolePermissions[actor.role].includes('RESOURCE_VIEW');
  const equipment = canEquipment ? await db.equipment.findMany({
    where: { organizationId: actor.organizationId, active: true },
    include: {
      maintenance: { orderBy: { scheduledAt: 'asc' } },
      allocations: { orderBy: { startAt: 'asc' } },
    },
    orderBy: { name: 'asc' },
  }) : [];
  const maintenanceSamples: { x: number[]; y: number }[] = [];
  for (const asset of equipment) {
    let previous = asset.commissionedAt || asset.createdAt;
    for (const record of asset.maintenance.filter((row) => row.status === 'COMPLETED' && row.completedAt)) {
      const daysSinceService = Math.max(0, (record.scheduledAt.getTime() - previous.getTime()) / dayMs);
      const ageDays = Math.max(0, (record.scheduledAt.getTime() - (asset.commissionedAt || asset.createdAt).getTime()) / dayMs);
      maintenanceSamples.push({
        x: [1, Math.min(daysSinceService / asset.serviceIntervalDays, 3), Math.min(allocationDays(asset.allocations, record.scheduledAt) / 90, 1), Math.min(ageDays / 3650, 2), ['HIGH', 'CRITICAL'].includes(record.priority) ? 1 : 0],
        y: record.failureRelated ? 1 : 0,
      });
      previous = record.completedAt!;
    }
  }
  const maintenanceModel = trainBinaryLogistic(maintenanceSamples);
  const now = new Date();
  const maintenancePredictions = equipment.map((asset) => {
    const completed = asset.maintenance.filter((row) => row.status === 'COMPLETED' && row.completedAt);
    const lastService = completed.at(-1)?.completedAt || asset.commissionedAt || asset.createdAt;
    const daysSinceService = Math.max(0, Math.floor((now.getTime() - lastService.getTime()) / dayMs));
    const ageDays = Math.max(0, (now.getTime() - (asset.commissionedAt || asset.createdAt).getTime()) / dayMs);
    const openHighPriority = asset.maintenance.some((row) => ['SCHEDULED', 'IN_PROGRESS'].includes(row.status) && ['HIGH', 'CRITICAL'].includes(row.priority));
    const x = [1, Math.min(daysSinceService / asset.serviceIntervalDays, 3), Math.min(allocationDays(asset.allocations, now) / 90, 1), Math.min(ageDays / 3650, 2), openHighPriority ? 1 : 0];
    const probability = maintenanceModel.ready ? sigmoid(x.reduce((sum, value, index) => sum + value * maintenanceModel.weights[index]!, 0)) : null;
    const dueInDays = asset.serviceIntervalDays - daysSinceService;
    const reasons: string[] = [];
    if (dueInDays <= 0) reasons.push(`Service interval exceeded by ${Math.abs(dueInDays)} day${Math.abs(dueInDays) === 1 ? '' : 's'}`);
    else if (dueInDays <= 14) reasons.push(`Scheduled service due in ${dueInDays} days`);
    if (allocationDays(asset.allocations, now) >= 60) reasons.push('High allocation during the last 90 days');
    if (openHighPriority) reasons.push('High-priority maintenance is open');
    if (!reasons.length) reasons.push('Within configured service interval');
    return {
      id: asset.id, code: asset.code, name: asset.name, type: asset.type, daysSinceService, serviceIntervalDays: asset.serviceIntervalDays,
      nextServiceDate: new Date(lastService.getTime() + asset.serviceIntervalDays * dayMs),
      failureProbability: probability === null ? null : Math.round(probability * 100),
      band: probability === null ? (dueInDays <= 0 ? 'DUE' : 'BASELINE') : probability >= 0.7 ? 'HIGH' : probability >= 0.4 ? 'MEDIUM' : 'LOW',
      reasons,
    };
  }).sort((a, b) => (b.failureProbability ?? (b.band === 'DUE' ? 101 : -1)) - (a.failureProbability ?? (a.band === 'DUE' ? 101 : -1)));

  return ok(res, {
    generatedAt: new Date(),
    scheduleDelay: {
      model: 'Organization-scoped logistic regression',
      version: 'schedule-delay-v1',
      status: model.ready ? 'READY' : 'INSUFFICIENT_DATA',
      trainingSamples: model.samples,
      delayedSamples: model.positives,
      minimumRequired: '12 completed items, including at least 3 late and 3 on-time outcomes',
      trainingDiagnostic: model.ready ? { brierScore: Number(model.brier!.toFixed(3)), note: 'In-sample diagnostic; holdout validation is required before operational reliance.' } : null,
      predictions: schedulePredictions,
    },
    costAtCompletion: {
      model: 'Organization-scoped ridge regression',
      version: 'cost-completion-v1',
      status: costModel.ready ? 'READY' : 'INSUFFICIENT_DATA',
      currency: actor.organization.currency,
      trainingSamples: costSamples.length,
      minimumRequired: '10 financially settled closed projects with varied final cost outcomes',
      trainingDiagnostic: costModel.ready ? { rootMeanSquaredErrorRatio: Number(costModel.rmse!.toFixed(3)), note: 'In-sample diagnostic; time-based holdout validation is required before operational reliance.' } : null,
      predictions: costPredictions,
    },
    materialDemand: canInventory ? {
      model: 'Exponentially weighted weekly demand',
      version: 'material-demand-v1',
      alpha: 0.45,
      minimumRequired: 'Two weeks with outbound stock movements',
      forecasts: materialForecasts,
    } : null,
    equipmentMaintenance: canEquipment ? {
      model: 'Organization-scoped logistic failure classifier',
      version: 'equipment-maintenance-v1',
      status: maintenanceModel.ready ? 'READY' : 'INSUFFICIENT_DATA',
      trainingSamples: maintenanceModel.samples,
      failureSamples: maintenanceModel.positives,
      minimumRequired: '12 completed maintenance outcomes, including at least 3 failure-related and 3 preventive outcomes',
      trainingDiagnostic: maintenanceModel.ready ? { brierScore: Number(maintenanceModel.brier!.toFixed(3)), note: 'In-sample diagnostic; holdout validation is required before operational reliance.' } : null,
      assets: maintenancePredictions,
    } : null,
    safeguards: [
      'Predictions support review and never approve, reject or change records automatically.',
      'Training and inference use only records visible to the signed-in user.',
      'Insufficient history produces no probability instead of a fabricated estimate.',
    ],
  });
});

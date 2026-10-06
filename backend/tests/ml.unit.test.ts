import {
  exponentialForecast,
  scheduleFeatures,
  ScheduleRecord,
  sigmoid,
  trainBinaryLogistic,
  trainRidgeRegression,
  trainLogistic,
} from '../src/modules/ml/ml.routes';

function record(index: number, late: boolean): ScheduleRecord {
  const startDate = new Date('2026-01-01T00:00:00Z');
  const plannedDate = new Date('2026-02-01T00:00:00Z');
  return {
    id: `item-${index}`,
    projectId: `project-${index}`,
    kind: index % 2 ? 'TASK' : 'MILESTONE',
    name: `Training item ${index}`,
    description: '',
    startDate,
    plannedDate,
    actualDate: new Date(late ? '2026-02-12T00:00:00Z' : '2026-01-29T00:00:00Z'),
    status: 'COMPLETED',
    progress: 100,
    responsibleId: null,
    dependencyId: late ? `dependency-${index}` : null,
    version: 1,
    createdAt: startDate,
    updatedAt: plannedDate,
    project: {
      id: `project-${index}`,
      code: `P-${index}`,
      name: `Project ${index}`,
      priority: late ? 'HIGH' : 'MEDIUM',
    },
    delays: late ? [{ id: `delay-${index}` }] : [],
  };
}

test('logistic delay model trains only with sufficient outcome diversity', () => {
  expect(trainLogistic(Array.from({ length: 11 }, (_, index) => record(index, index > 5))).ready).toBe(false);
  const rows = Array.from({ length: 20 }, (_, index) => record(index, index >= 10));
  const model = trainLogistic(rows);
  expect(model.ready).toBe(true);
  if (!model.ready) throw new Error('Expected the model to train');
  const low = sigmoid(scheduleFeatures(record(30, false)).reduce((sum, value, index) => sum + value * model.weights[index]!, 0));
  const high = sigmoid(scheduleFeatures(record(31, true)).reduce((sum, value, index) => sum + value * model.weights[index]!, 0));
  expect(high).toBeGreaterThan(low);
  expect(model.brier).toBeLessThan(0.25);
});

test('material forecast weights recent demand more heavily', () => {
  expect(exponentialForecast([10, 10, 20], 0.5)).toBe(15);
  expect(exponentialForecast([20, 10, 10], 0.5)).toBe(12.5);
});

test('ridge cost model learns a continuous cost ratio', () => {
  const samples = Array.from({ length: 20 }, (_, index) => {
    const estimateRatio = 0.55 + index * 0.025;
    const highPriority = index % 3 === 0 ? 1 : 0;
    return {
      x: [1, estimateRatio, index / 40, highPriority],
      y: 0.25 + estimateRatio * 0.78 + highPriority * 0.08,
    };
  });
  const model = trainRidgeRegression(samples);
  expect(model.ready).toBe(true);
  if (!model.ready) throw new Error('Expected the cost model to train');
  const input = [1, 0.9, 0.3, 1];
  const prediction = input.reduce((sum, value, index) => sum + value * model.weights[index]!, 0);
  expect(prediction).toBeCloseTo(1.032, 1);
  expect(model.rmse).toBeLessThan(0.08);
});

test('equipment failure classifier learns service-overrun and utilization signals', () => {
  const samples = Array.from({ length: 24 }, (_, index) => {
    const failure = index >= 12;
    return {
      x: [1, failure ? 1.6 + index / 100 : 0.5 + index / 100, failure ? 0.85 : 0.2, index / 30, failure ? 1 : 0],
      y: failure ? 1 : 0,
    };
  });
  const model = trainBinaryLogistic(samples);
  expect(model.ready).toBe(true);
  if (!model.ready) throw new Error('Expected the maintenance model to train');
  const score = (x: number[]) => sigmoid(x.reduce((sum, value, index) => sum + value * model.weights[index]!, 0));
  expect(score([1, 1.8, 0.9, 0.8, 1])).toBeGreaterThan(score([1, 0.4, 0.1, 0.2, 0]));
});

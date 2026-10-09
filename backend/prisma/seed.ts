import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
const db = new PrismaClient();
const dayMs = 86_400_000;
const daysAfter = (date: Date, days: number) => new Date(date.getTime() + days * dayMs);
const trainingId = (series: number, index: number) =>
  `${series.toString(16).padStart(8, '0')}-0000-4000-8000-${String(index).padStart(12, '0')}`;
async function seed() {
  if (process.env.NODE_ENV === 'production')
    throw new Error('Demo seed is disabled in production.');
  const password = process.env.DEMO_PASSWORD;
  if (!password || password.length < 12)
    throw new Error('Set a development DEMO_PASSWORD of at least 12 characters.');
  const organization = await db.organization.upsert({
    where: { id: '10000000-0000-4000-8000-000000000001' },
    update: {},
    create: {
      id: '10000000-0000-4000-8000-000000000001',
      name: 'BuildTrack Construction',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
    },
  });
  const accounts: [string, string, Role][] = [
    ['admin', 'Anushka Sharma', 'ADMINISTRATOR'],
    ['manager', 'Arjun Mehta', 'PROJECT_MANAGER'],
    ['engineer', 'Priya Nair', 'SITE_ENGINEER'],
    ['contractor', 'Vikram Singh', 'CONTRACTOR'],
    ['worker', 'Ravi Kumar', 'WORKER'],
    ['client', 'Neha Kapoor', 'CLIENT'],
  ];
  for (const [alias, name, role] of accounts) {
    await db.user.upsert({
      where: { email: `${alias}@buildtrack.local` },
      update: {},
      create: {
        organizationId: organization.id,
        name,
        role,
        email: `${alias}@buildtrack.local`,
        passwordHash: await bcrypt.hash(password, 12),
      },
    });
  }
  const team = await db.user.findMany({
    where: {
      organizationId: organization.id,
      email: { in: accounts.map(([alias]) => `${alias}@buildtrack.local`) },
    },
  });
  const examples = [
    {
      code: 'BT-DEMO-001',
      name: 'Riverside Residences',
      category: 'Residential',
      city: 'Bengaluru',
      state: 'Karnataka',
      status: 'ACTIVE' as const,
      budget: '85000000',
      estimatedCost: '79000000',
    },
    {
      code: 'BT-DEMO-002',
      name: 'Northgate Business Park',
      category: 'Commercial',
      city: 'Pune',
      state: 'Maharashtra',
      status: 'PLANNING' as const,
      budget: '125000000',
      estimatedCost: '118000000',
    },
    {
      code: 'BT-DEMO-003',
      name: 'East Link Road',
      category: 'Infrastructure',
      city: 'Hyderabad',
      state: 'Telangana',
      status: 'ON_HOLD' as const,
      budget: '46000000',
      estimatedCost: '43000000',
    },
  ];
  for (const example of examples) {
    const project = await db.project.upsert({
      where: { organizationId_code: { organizationId: organization.id, code: example.code } },
      update: {},
      create: {
        ...example,
        organizationId: organization.id,
        description: 'Demonstration project for exploring BuildTrack workflows.',
        address: 'Demo construction site',
        country: 'India',
        startDate: new Date('2026-09-01'),
        endDate: new Date('2027-06-30'),
        notes: 'Seeded demonstration data. Edit to explore the project workflow.',
        members: {
          create: team
            .filter((user) => user.role !== 'WORKER')
            .map((user) => ({ userId: user.id })),
        },
      },
    });
    if (
      example.code === 'BT-DEMO-001' &&
      (await db.workItem.count({ where: { projectId: project.id } })) === 0
    ) {
      const manager = team.find((user) => user.role === 'PROJECT_MANAGER')!;
      const engineer = team.find((user) => user.role === 'SITE_ENGINEER')!;
      const foundation = await db.workItem.create({
        data: {
          projectId: project.id,
          kind: 'MILESTONE',
          name: 'Foundation and substructure',
          description: 'Excavation, footing and foundation quality checks.',
          startDate: new Date('2026-09-01'),
          plannedDate: new Date('2026-09-24'),
          actualDate: new Date('2026-09-23'),
          status: 'COMPLETED',
          progress: 100,
          responsibleId: manager.id,
        },
      });
      await db.workItem.create({
        data: {
          projectId: project.id,
          kind: 'MILESTONE',
          name: 'Structural frame',
          description: 'Complete the primary reinforced concrete structure.',
          startDate: new Date('2026-09-24'),
          plannedDate: new Date('2026-12-15'),
          status: 'IN_PROGRESS',
          progress: 35,
          responsibleId: engineer.id,
          dependencyId: foundation.id,
        },
      });
      await db.siteReport.create({
        data: {
          projectId: project.id,
          authorId: engineer.id,
          reportDate: new Date('2026-09-24'),
          weather: 'Clear, 29°C',
          workersPresent: 42,
          workCompleted: 'Foundation handover and column reinforcement started.',
          reportedProgress: 28,
          materialsUsed: 'TMT steel, concrete and binding wire',
          equipmentUsed: 'Concrete mixer and mobile crane',
          safetyObservations: 'Toolbox talk completed; PPE compliance verified.',
          issues: '',
          notes: 'Demo site report.',
        },
      });
      await db.inspection.create({
        data: {
          projectId: project.id,
          inspectorId: engineer.id,
          date: new Date('2026-09-23'),
          location: 'Foundation grid A–D',
          type: 'Structural quality',
          result: 'PASSED',
          findings: 'Reinforcement and cube-test records meet the approved specification.',
          resolved: true,
        },
      });
    }
    if (
      example.code === 'BT-DEMO-002' &&
      (await db.workItem.count({ where: { projectId: project.id } })) === 0
    ) {
      const manager = team.find((user) => user.role === 'PROJECT_MANAGER')!;
      await db.workItem.createMany({
        data: [
          {
            projectId: project.id,
            kind: 'MILESTONE',
            name: 'Design coordination',
            description: 'Coordinate architectural, structural and services design.',
            startDate: new Date('2026-09-01'),
            plannedDate: new Date('2026-11-15'),
            status: 'IN_PROGRESS',
            progress: 20,
            weight: '1.5',
            responsibleId: manager.id,
          },
          {
            projectId: project.id,
            kind: 'MILESTONE',
            name: 'Mobilization',
            description: 'Prepare the site and mobilize the delivery team.',
            startDate: new Date('2026-10-01'),
            plannedDate: new Date('2026-12-01'),
            status: 'IN_PROGRESS',
            progress: 10,
            weight: '1',
            responsibleId: manager.id,
          },
        ],
      });
    }
    if (
      example.code === 'BT-DEMO-003' &&
      (await db.workItem.count({ where: { projectId: project.id } })) === 0
    ) {
      const engineer = team.find((user) => user.role === 'SITE_ENGINEER')!;
      await db.workItem.createMany({
        data: [
          {
            projectId: project.id,
            kind: 'MILESTONE',
            name: 'Earthworks',
            description: 'Complete grading and subgrade preparation.',
            startDate: new Date('2026-09-01'),
            plannedDate: new Date('2026-10-05'),
            actualDate: new Date('2026-10-04'),
            status: 'COMPLETED',
            progress: 100,
            weight: '1',
            responsibleId: engineer.id,
          },
          {
            projectId: project.id,
            kind: 'MILESTONE',
            name: 'Drainage installation',
            description: 'Install cross drainage and roadside channels.',
            startDate: new Date('2026-10-05'),
            plannedDate: new Date('2026-12-20'),
            status: 'IN_PROGRESS',
            progress: 30,
            weight: '2',
            responsibleId: engineer.id,
          },
        ],
      });
    }
  }
  const manager = team.find((user) => user.role === 'PROJECT_MANAGER')!;
  const costOutcomeRatios = [0.68, 0.74, 0.79, 0.83, 0.88, 0.93, 0.97, 1.02, 1.08, 1.14, 0.86, 1.2];
  const estimateRatios = [0.65, 0.7, 0.76, 0.8, 0.84, 0.89, 0.92, 0.96, 1.0, 1.04, 0.82, 1.08];
  for (let index = 0; index < costOutcomeRatios.length; index += 1) {
    const sequence = index + 1;
    const code = `ML-HIST-${String(sequence).padStart(2, '0')}`;
    const budget = 10_000_000 + index * 750_000;
    const startDate = new Date(Date.UTC(2024, index % 6, 1));
    const endDate = daysAfter(startDate, 180 + index * 18);
    const project = await db.project.upsert({
      where: { organizationId_code: { organizationId: organization.id, code } },
      update: { trainingData: true },
      create: {
        id: trainingId(48, sequence),
        organizationId: organization.id,
        code,
        name: `ML historical project ${String(sequence).padStart(2, '0')}`,
        description:
          'Synthetic closed-project outcome used only to demonstrate organization-scoped ML training.',
        category:
          index % 3 === 0 ? 'Infrastructure' : index % 2 === 0 ? 'Commercial' : 'Residential',
        address: 'Historical demonstration site',
        city: index % 2 === 0 ? 'Pune' : 'Bengaluru',
        state: index % 2 === 0 ? 'Maharashtra' : 'Karnataka',
        country: 'India',
        status: 'CLOSED',
        priority: index >= 8 || index % 4 === 0 ? 'HIGH' : 'MEDIUM',
        startDate,
        endDate,
        budget: budget.toFixed(2),
        estimatedCost: (budget * estimateRatios[index]!).toFixed(2),
        notes: 'DEMO_ML_TRAINING_DATA: safe to replace with verified historical project outcomes.',
        trainingData: true,
      },
    });
    await db.projectMember.createMany({
      data: team.map((user) => ({ projectId: project.id, userId: user.id })),
      skipDuplicates: true,
    });
    const isLate = index % 2 === 1;
    const workStart = daysAfter(startDate, 14);
    const plannedDate = daysAfter(workStart, 30 + index * 4);
    const workItem = await db.workItem.upsert({
      where: { id: trainingId(49, sequence) },
      update: {
        projectId: project.id,
        actualDate: daysAfter(plannedDate, isLate ? 5 + index : -(2 + (index % 3))),
        status: 'COMPLETED',
        progress: 100,
      },
      create: {
        id: trainingId(49, sequence),
        projectId: project.id,
        kind: index % 3 === 0 ? 'MILESTONE' : 'TASK',
        name: `Historical schedule outcome ${String(sequence).padStart(2, '0')}`,
        description: 'Synthetic completed schedule record for delay-classifier training.',
        startDate: workStart,
        plannedDate,
        actualDate: daysAfter(plannedDate, isLate ? 5 + index : -(2 + (index % 3))),
        status: 'COMPLETED',
        progress: 100,
        weight: '1',
        baselineStartDate: workStart,
        baselinePlannedDate: plannedDate,
        responsibleId: manager.id,
      },
    });
    if (isLate)
      await db.siteDelay.upsert({
        where: { id: trainingId(51, sequence) },
        update: {},
        create: {
          id: trainingId(51, sequence),
          projectId: project.id,
          reporterId: manager.id,
          workItemId: workItem.id,
          date: plannedDate,
          cause: index % 4 === 1 ? 'Synthetic supplier delay' : 'Synthetic weather disruption',
          daysDelayed: 5 + index,
          impact: 'Demonstration outcome for schedule-delay model training.',
          correctiveAction: 'Historical record; no operational action required.',
          critical: index >= 7,
          status: 'RESOLVED',
        },
      });
    const sourceRef = `ML-COST-${String(sequence).padStart(2, '0')}`;
    const expenseData = {
      organizationId: organization.id,
      projectId: project.id,
      category: 'Historical settled cost',
      description: 'Synthetic final cost outcome for cost-at-completion model training.',
      amount: (budget * costOutcomeRatios[index]!).toFixed(2),
      currency: 'INR',
      expenseDate: endDate,
      sourceRef,
      status: 'PAID' as const,
      createdById: manager.id,
      approvedById: manager.id,
      notes: 'DEMO_ML_TRAINING_DATA: replace with audited settled costs before operational use.',
    };
    await db.expense.upsert({
      where: { organizationId_sourceRef: { organizationId: organization.id, sourceRef } },
      update: expenseData,
      create: { id: trainingId(50, sequence), ...expenseData },
    });
  }
  if ((await db.equipment.count({ where: { organizationId: organization.id } })) === 0) {
    await db.equipment.createMany({
      data: [
        {
          organizationId: organization.id,
          code: 'EX-104',
          name: 'Hydraulic Excavator',
          type: 'Excavator',
          location: 'Central equipment yard',
          status: 'AVAILABLE',
          hourlyRate: '2200',
          notes: 'Demo equipment record.',
        },
        {
          organizationId: organization.id,
          code: 'CR-08',
          name: 'Tower Crane 08',
          type: 'Crane',
          location: 'Riverside Residences',
          status: 'AVAILABLE',
          hourlyRate: '4500',
          notes: 'Demo equipment record.',
        },
      ],
    });
  }
  const demoEquipment = await db.equipment.findMany({
    where: { organizationId: organization.id, code: { in: ['EX-104', 'CR-08'] } },
  });
  const excavator = demoEquipment.find((item) => item.code === 'EX-104');
  const crane = demoEquipment.find((item) => item.code === 'CR-08');
  if (excavator && !excavator.commissionedAt)
    await db.equipment.update({
      where: { id: excavator.id },
      data: { commissionedAt: new Date('2024-01-10'), serviceIntervalDays: 60 },
    });
  if (crane && !crane.commissionedAt)
    await db.equipment.update({
      where: { id: crane.id },
      data: { commissionedAt: new Date('2024-10-01'), serviceIntervalDays: 90 },
    });
  const allocationProject = await db.project.findFirstOrThrow({
    where: { organizationId: organization.id, code: 'BT-DEMO-001' },
  });
  const allocationWeek = new Date();
  allocationWeek.setUTCHours(8, 0, 0, 0);
  allocationWeek.setUTCDate(
    allocationWeek.getUTCDate() - ((allocationWeek.getUTCDay() + 6) % 7) - 11 * 7,
  );
  for (const [assetIndex, asset] of [excavator, crane].entries()) {
    if (!asset) continue;
    for (let week = 0; week < 12; week += 1) {
      const startAt = new Date(allocationWeek.getTime() + week * 7 * dayMs);
      const allocatedDays = 2 + ((week + assetIndex * 2) % 4);
      const endAt = daysAfter(startAt, allocatedDays);
      await db.equipmentAllocation.upsert({
        where: { id: trainingId(64 + assetIndex, week + 1) },
        update: {
          equipmentId: asset.id,
          projectId: allocationProject.id,
          startAt,
          endAt,
          releasedAt: endAt,
        },
        create: {
          id: trainingId(64 + assetIndex, week + 1),
          equipmentId: asset.id,
          projectId: allocationProject.id,
          startAt,
          endAt,
          releasedAt: endAt,
          notes: 'Synthetic historical allocation used to demonstrate fleet utilization trends.',
        },
      });
    }
  }
  const maintenanceExamples = [
    [
      '21000000-0000-4000-8000-000000000001',
      excavator?.id,
      'Hydraulic system failure repair',
      '2025-01-15',
      true,
      'CRITICAL',
      '18.0',
    ],
    [
      '21000000-0000-4000-8000-000000000002',
      excavator?.id,
      'Preventive fluid and filter service',
      '2025-03-15',
      false,
      'MEDIUM',
      '4.0',
    ],
    [
      '21000000-0000-4000-8000-000000000003',
      excavator?.id,
      'Boom cylinder seal failure',
      '2025-06-10',
      true,
      'HIGH',
      '14.5',
    ],
    [
      '21000000-0000-4000-8000-000000000004',
      excavator?.id,
      'Scheduled undercarriage inspection',
      '2025-08-05',
      false,
      'LOW',
      '3.0',
    ],
    [
      '21000000-0000-4000-8000-000000000005',
      excavator?.id,
      'Fuel pump breakdown repair',
      '2025-11-20',
      true,
      'CRITICAL',
      '22.0',
    ],
    [
      '21000000-0000-4000-8000-000000000006',
      excavator?.id,
      'Preventive engine service',
      '2026-02-01',
      false,
      'MEDIUM',
      '5.0',
    ],
    [
      '21000000-0000-4000-8000-000000000007',
      excavator?.id,
      'Final-drive failure repair',
      '2026-06-25',
      true,
      'CRITICAL',
      '26.0',
    ],
    [
      '21000000-0000-4000-8000-000000000008',
      crane?.id,
      'Scheduled wire-rope inspection',
      '2024-12-20',
      false,
      'LOW',
      '2.0',
    ],
    [
      '21000000-0000-4000-8000-000000000009',
      crane?.id,
      'Preventive brake adjustment',
      '2025-03-18',
      false,
      'MEDIUM',
      '3.5',
    ],
    [
      '21000000-0000-4000-8000-000000000010',
      crane?.id,
      'Hoist motor failure repair',
      '2025-07-28',
      true,
      'HIGH',
      '16.0',
    ],
    [
      '21000000-0000-4000-8000-000000000011',
      crane?.id,
      'Scheduled slew-ring lubrication',
      '2025-10-15',
      false,
      'LOW',
      '2.5',
    ],
    [
      '21000000-0000-4000-8000-000000000012',
      crane?.id,
      'Limit-switch failure repair',
      '2026-02-25',
      true,
      'CRITICAL',
      '12.0',
    ],
    [
      '21000000-0000-4000-8000-000000000013',
      crane?.id,
      'Preventive electrical inspection',
      '2026-05-20',
      false,
      'MEDIUM',
      '4.0',
    ],
    [
      '21000000-0000-4000-8000-000000000014',
      crane?.id,
      'Trolley brake failure repair',
      '2026-08-25',
      true,
      'HIGH',
      '10.0',
    ],
  ] as const;
  for (const [
    id,
    equipmentId,
    type,
    date,
    failureRelated,
    priority,
    downtimeHours,
  ] of maintenanceExamples) {
    if (!equipmentId) continue;
    const completedAt = new Date(`${date}T16:00:00.000Z`);
    await db.maintenanceRecord.upsert({
      where: { id },
      update: {},
      create: {
        id,
        equipmentId,
        type,
        scheduledAt: new Date(`${date}T08:00:00.000Z`),
        completedAt,
        failureRelated,
        downtimeHours,
        priority,
        status: 'COMPLETED',
        notes: 'Seeded demonstration outcome for equipment-maintenance model training.',
      },
    });
  }
  if (excavator)
    await db.maintenanceRecord.upsert({
      where: { id: '21000000-0000-4000-8000-000000000015' },
      update: {},
      create: {
        id: '21000000-0000-4000-8000-000000000015',
        equipmentId: excavator.id,
        type: 'Hydraulic pressure-loss inspection',
        scheduledAt: new Date('2026-10-10T08:00:00.000Z'),
        failureRelated: false,
        downtimeHours: '0',
        priority: 'HIGH',
        status: 'SCHEDULED',
        notes: 'Open demonstration finding. Complete or cancel it from Equipment when resolved.',
      },
    });
  if ((await db.material.count({ where: { organizationId: organization.id } })) === 0) {
    await db.material.createMany({
      data: [
        {
          organizationId: organization.id,
          sku: 'CEM-OPC-43',
          name: 'OPC 43 Grade Cement',
          category: 'Cement',
          unit: 'bags',
          currentStock: '860',
          minimumLevel: '300',
          criticalLevel: '120',
          unitCost: '415',
          supplier: 'Deccan Cement Supply',
        },
        {
          organizationId: organization.id,
          sku: 'STL-TMT-12',
          name: '12mm TMT Steel',
          category: 'Steel',
          unit: 'tonnes',
          currentStock: '18.5',
          minimumLevel: '12',
          criticalLevel: '5',
          unitCost: '58500',
          supplier: 'Metro Steel Works',
        },
        {
          organizationId: organization.id,
          sku: 'BRK-RED-01',
          name: 'Red Clay Bricks',
          category: 'Bricks',
          unit: 'pieces',
          currentStock: '0',
          minimumLevel: '5000',
          criticalLevel: '1500',
          unitCost: '9.50',
          supplier: 'Riverside Brick Depot',
        },
      ],
    });
  }
  const materialDemandHistory: Record<string, number[]> = {
    'CEM-OPC-43': [95, 110, 102, 120, 128, 134, 129, 142, 150, 147, 158, 165],
    'STL-TMT-12': [0.8, 1.1, 0.9, 1.3, 1.2, 1.5, 1.4, 1.6, 1.8, 1.7, 1.9, 2.1],
    'BRK-RED-01': [1800, 2100, 1950, 2400, 2600, 2500, 2800, 3000, 3200, 3100, 3400, 3600],
  };
  const demandMaterials = await db.material.findMany({
    where: { organizationId: organization.id, sku: { in: Object.keys(materialDemandHistory) } },
  });
  for (let materialIndex = 0; materialIndex < demandMaterials.length; materialIndex += 1) {
    const material = demandMaterials[materialIndex]!;
    const weeklyDemand = materialDemandHistory[material.sku]!;
    for (let week = 0; week < weeklyDemand.length; week += 1) {
      const demand = weeklyDemand[week]!;
      const movementData = {
        materialId: material.id,
        type: 'ISSUE' as const,
        stockDelta: (-demand).toString(),
        allocatedDelta: '0',
        balanceAfter: material.currentStock,
        allocatedAfter: material.allocatedStock,
        note: 'Synthetic weekly usage observation for material-demand forecasting.',
        createdAt: new Date(Date.UTC(2026, 5, 29 + week * 7, 9)),
      };
      await db.stockMovement.upsert({
        where: { id: trainingId(52 + materialIndex, week + 1) },
        update: movementData,
        create: { id: trainingId(52 + materialIndex, week + 1), ...movementData },
      });
    }
  }
  if ((await db.workerProfile.count({ where: { organizationId: organization.id } })) === 0) {
    const workerAccount = team.find((user) => user.role === 'WORKER')!;
    const project = await db.project.findFirstOrThrow({
      where: { organizationId: organization.id, code: 'BT-DEMO-001' },
    });
    const workers = await Promise.all([
      db.workerProfile.create({
        data: {
          organizationId: organization.id,
          userId: workerAccount.id,
          employeeCode: 'EMP-001',
          name: workerAccount.name,
          category: 'Mason',
          phone: '+91 98765 41001',
          hourlyRate: '275',
        },
      }),
      db.workerProfile.create({
        data: {
          organizationId: organization.id,
          employeeCode: 'EMP-002',
          name: 'Meera Patil',
          category: 'Electrician',
          phone: '+91 98765 41002',
          hourlyRate: '320',
        },
      }),
    ]);
    for (const worker of workers)
      await db.workerProjectAssignment.create({
        data: {
          workerId: worker.id,
          projectId: project.id,
          startDate: new Date('2026-09-01'),
          role: worker.category,
        },
      });
  }
  if ((await db.vendor.count({ where: { organizationId: organization.id } })) === 0) {
    await db.vendor.createMany({
      data: [
        {
          organizationId: organization.id,
          code: 'VEN-DECCAN',
          name: 'Deccan Cement Supply',
          contactName: 'Sanjay Rao',
          email: 'orders@deccan.example',
          phone: '+91 98765 42001',
          address: 'Bengaluru, Karnataka',
        },
        {
          organizationId: organization.id,
          code: 'VEN-METRO',
          name: 'Metro Steel Works',
          contactName: 'Farah Khan',
          email: 'sales@metrosteel.example',
          phone: '+91 98765 42002',
          address: 'Pune, Maharashtra',
        },
      ],
    });
  }
  console.log(
    'Seed complete: accounts, operational demos, 12 schedule outcomes, 12 settled project costs, 36 weekly material-demand observations, 14 maintenance outcomes, workforce and vendors. Existing records were not overwritten.',
  );
}
seed()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : 'Seed failed');
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());

import request from 'supertest';
import { readFile, unlink } from 'node:fs/promises';
import bcrypt from 'bcryptjs';
import { app } from '../src/app';
import { db } from '../src/shared/db';
import { env } from '../src/config/env';
import { hashToken, newToken } from '../src/modules/auth/auth.service';

const password = 'FoundationTest2026!';
let adminToken = '';
let clientToken = '';
let clientId = '';
let adminOrg = '';
const browser = { Origin: 'http://localhost:4200', 'X-BuildTrack-Client': 'web' };
beforeAll(async () => {
  if (!new URL(env.DATABASE_URL).pathname.endsWith('_test'))
    throw new Error('Integration tests require an isolated _test database');
  await db.shift.deleteMany();
  await db.attendance.deleteMany();
  await db.workerProjectAssignment.deleteMany();
  await db.workerProfile.deleteMany();
  await db.notification.deleteMany();
  await db.documentVersion.deleteMany();
  await db.document.deleteMany();
  await db.stockMovement.deleteMany();
  await db.expense.deleteMany();
  await db.budgetAllocation.deleteMany();
  await db.invoice.deleteMany();
  await db.goodsReceipt.deleteMany();
  await db.purchaseOrder.deleteMany();
  await db.procurementRequest.deleteMany();
  await db.vendor.deleteMany();
  await db.maintenanceRecord.deleteMany();
  await db.equipmentAllocation.deleteMany();
  await db.equipment.deleteMany();
  await db.materialRequest.deleteMany();
  await db.material.deleteMany();
  await db.projectMember.deleteMany();
  await db.project.deleteMany();
  await db.auditLog.deleteMany();
  await db.passwordReset.deleteMany();
  await db.refreshTokenUse.deleteMany();
  await db.authSession.deleteMany();
  await db.user.deleteMany();
  await db.organization.deleteMany();
  const org = await db.organization.create({ data: { name: 'Test construction organization' } });
  adminOrg = org.id;
  await db.user.create({
    data: {
      name: 'Test Administrator',
      email: 'admin@integration.test',
      passwordHash: await bcrypt.hash(password, 12),
      role: 'ADMINISTRATOR',
      organizationId: org.id,
    },
  });
  adminToken = (
    await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@integration.test', password })
  ).body.data.accessToken;
});
afterAll(() => db.$disconnect());

test('registration persists an isolated, nonprivileged client with a hashed password', async () => {
  const response = await request(app).post('/api/v1/auth/register').send({
    name: 'Priya Client',
    email: 'CLIENT@integration.test',
    company: 'Independent construction',
    password,
  });
  expect(response.status).toBe(201);
  expect(response.body.data.role).toBe('CLIENT');
  expect(response.body.data.passwordHash).toBeUndefined();
  clientId = response.body.data.id;
  const user = await db.user.findUniqueOrThrow({ where: { id: clientId } });
  expect(user.organizationId).not.toBe(adminOrg);
  expect(user.passwordHash).not.toBe(password);
  expect(await bcrypt.compare(password, user.passwordHash)).toBe(true);
  clientToken = (
    await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'client@integration.test', password })
  ).body.data.accessToken;
});
test('administrator manages members with tenant isolation and session revocation', async () => {
  const member = {
    name: 'Managed Worker',
    email: 'managed@integration.test',
    role: 'WORKER',
    password,
  };
  expect(
    (
      await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(member)
    ).status,
  ).toBe(403);
  const created = await request(app)
    .post('/api/v1/users')
    .set('Authorization', `Bearer ${adminToken}`)
    .send(member);
  expect(created.status).toBe(201);
  expect(created.body.data.passwordHash).toBeUndefined();
  expect(created.body.data.mustChangePassword).toBe(true);
  const id = created.body.data.id;
  expect((await db.user.findUniqueOrThrow({ where: { id } })).organizationId).toBe(adminOrg);
  expect(await db.passwordReset.count({ where: { userId: id, usedAt: null } })).toBe(1);
  const login = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: member.email, password });
  const token = login.body.data.accessToken;
  expect(
    (await request(app).get('/api/v1/projects').set('Authorization', `Bearer ${token}`)).status,
  ).toBe(403);
  const update = { name: member.name, email: member.email, role: 'SITE_ENGINEER', active: true };
  expect(
    (
      await request(app)
        .patch(`/api/v1/users/${clientId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(update)
    ).status,
  ).toBe(404);
  expect(
    (
      await request(app)
        .patch(`/api/v1/users/${id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(update)
    ).status,
  ).toBe(200);
  expect(
    (await request(app).get('/api/v1/account/overview').set('Authorization', `Bearer ${token}`))
      .status,
  ).toBe(401);
  expect(
    (
      await request(app)
        .patch(`/api/v1/users/${id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...update, active: false })
    ).status,
  ).toBe(200);
  expect(
    (await request(app).post('/api/v1/auth/login').send({ email: member.email, password })).status,
  ).toBe(401);
  const admin = await db.user.findUniqueOrThrow({ where: { email: 'admin@integration.test' } });
  expect(
    (
      await request(app)
        .patch(`/api/v1/users/${admin.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: admin.name, email: admin.email, role: 'WORKER', active: true })
    ).status,
  ).toBe(409);
  expect(
    (
      await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(member)
    ).status,
  ).toBe(409);
  expect(await db.auditLog.count({ where: { entityId: id, action: 'USER_UPDATED' } })).toBe(2);
  await db.auditLog.deleteMany({ where: { entityId: id } });
  await db.user.delete({ where: { id } });
});

test('project workflow validates dates, assignments, finance visibility and status transitions', async () => {
  const admin = await db.user.findUniqueOrThrow({ where: { email: 'admin@integration.test' } });
  const payload = {
    code: 'BT-TEST-001',
    name: 'Integration Project',
    description: 'Project workflow',
    category: 'Residential',
    address: '12 Site Road',
    city: 'Pune',
    state: 'Maharashtra',
    country: 'India',
    priority: 'HIGH',
    startDate: '2026-09-24',
    endDate: '2027-06-30',
    budget: '2500000.50',
    estimatedCost: '2000000',
    notes: '',
    memberIds: [] as string[],
  };
  const auth = { Authorization: `Bearer ${adminToken}` };
  expect(
    (
      await request(app)
        .post('/api/v1/projects')
        .set(auth)
        .send({ ...payload, endDate: '2026-01-01' })
    ).status,
  ).toBe(422);
  expect(
    (
      await request(app)
        .post('/api/v1/projects')
        .set(auth)
        .send({ ...payload, memberIds: [clientId] })
    ).status,
  ).toBe(422);
  expect(
    (
      await request(app)
        .post('/api/v1/projects')
        .set({ Authorization: `Bearer ${clientToken}` })
        .send(payload)
    ).status,
  ).toBe(403);
  const created = await request(app).post('/api/v1/projects').set(auth).send(payload);
  expect(created.status).toBe(201);
  const id = created.body.data.id;
  expect(created.body.data.members[0].user.id).toBe(admin.id);
  const page = await request(app)
    .get('/api/v1/projects?page=1&limit=1&sort=name&direction=asc')
    .set(auth);
  expect(page.status).toBe(200);
  expect(page.body.data).toHaveLength(1);
  expect(page.body.meta).toMatchObject({ page: 1, limit: 1, total: 1, totalPages: 1 });
  expect(
    (
      await request(app)
        .get(`/api/v1/projects/${id}`)
        .set({ Authorization: `Bearer ${clientToken}` })
    ).status,
  ).toBe(404);
  expect((await request(app).post('/api/v1/projects').set(auth).send(payload)).status).toBe(409);
  const assigned = await db.user.create({
    data: {
      organizationId: adminOrg,
      email: 'project-client@integration.test',
      name: 'Project Client',
      role: 'CLIENT',
      passwordHash: await bcrypt.hash(password, 12),
    },
  });
  const login = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: assigned.email, password });
  const assignedAuth = { Authorization: `Bearer ${login.body.data.accessToken}` };
  expect((await request(app).get('/api/v1/projects').set(assignedAuth)).body.data).toEqual([]);
  expect(
    (
      await request(app)
        .patch(`/api/v1/projects/${id}`)
        .set(auth)
        .send({ ...payload, memberIds: [assigned.id] })
    ).status,
  ).toBe(200);
  const view = await request(app).get(`/api/v1/projects/${id}`).set(assignedAuth);
  expect(view.status).toBe(200);
  expect(view.body.data.budget).toBeUndefined();
  expect(view.body.data.estimatedCost).toBeUndefined();
  expect(
    (
      await request(app)
        .patch(`/api/v1/projects/${id}/status`)
        .set(assignedAuth)
        .send({ status: 'ACTIVE' })
    ).status,
  ).toBe(403);
  expect(
    (await request(app).patch(`/api/v1/projects/${id}/status`).set(auth).send({ status: 'CLOSED' }))
      .status,
  ).toBe(409);
  expect(
    (await request(app).patch(`/api/v1/projects/${id}/status`).set(auth).send({ status: 'ACTIVE' }))
      .status,
  ).toBe(200);
  expect(
    (
      await request(app)
        .patch(`/api/v1/projects/${id}/status`)
        .set(auth)
        .send({ status: 'COMPLETED' })
    ).status,
  ).toBe(409);
  const milestone = await request(app).post(`/api/v1/projects/${id}/schedule`).set(auth).send({
    kind: 'MILESTONE',
    name: 'Foundation complete',
    description: 'Verified milestone',
    startDate: '2026-09-24',
    plannedDate: '2026-09-28',
    actualDate: '2026-09-28',
    status: 'COMPLETED',
    progress: 100,
    responsibleId: admin.id,
    dependencyId: null,
  });
  expect(milestone.status).toBe(201);
  const task = await request(app).post(`/api/v1/projects/${id}/schedule`).set(auth).send({
    kind: 'TASK',
    name: 'Dependent handover',
    description: '',
    startDate: '2026-09-28',
    plannedDate: '2026-10-10',
    actualDate: null,
    status: 'NOT_STARTED',
    progress: 0,
    responsibleId: admin.id,
    dependencyId: milestone.body.data.id,
  });
  expect(task.status).toBe(201);
  expect(
    (
      await request(app)
        .patch(`/api/v1/projects/${id}/status`)
        .set(auth)
        .send({ status: 'COMPLETED' })
    ).status,
  ).toBe(409);
  expect(
    (
      await request(app)
        .patch(`/api/v1/projects/${id}/schedule/${task.body.data.id}`)
        .set(auth)
        .send({
          kind: 'TASK',
          name: 'Dependent handover',
          description: '',
          startDate: '2026-09-28',
          plannedDate: '2026-10-10',
          actualDate: '2026-09-28',
          status: 'COMPLETED',
          progress: 100,
          responsibleId: admin.id,
          dependencyId: milestone.body.data.id,
          version: task.body.data.version,
        })
    ).status,
  ).toBe(200);
  const reportPayload = {
    reportDate: '2026-09-28',
    weather: 'Clear',
    workersPresent: 12,
    workCompleted: 'Foundation inspection completed',
    reportedProgress: 100,
    materialsUsed: 'Concrete',
    equipmentUsed: 'Mixer',
    safetyObservations: 'PPE verified',
    issues: '',
    notes: '',
  };
  const report = await request(app)
    .post(`/api/v1/projects/${id}/site/reports`)
    .set(auth)
    .send(reportPayload);
  expect(report.status).toBe(201);
  const attachment = await request(app)
    .post(`/api/v1/projects/${id}/site/reports/${report.body.data.id}/attachments`)
    .set(auth)
    .attach('file', Buffer.from('%PDF-1.4\n%%EOF'), {
      filename: 'site-photo-report.pdf',
      contentType: 'application/pdf',
    });
  expect(attachment.status).toBe(201);
  const attachmentDownload = await request(app)
    .get(`/api/v1/projects/${id}/site/reports/attachments/${attachment.body.data.id}/download`)
    .set(auth);
  expect(attachmentDownload.status).toBe(200);
  expect(
    (await request(app).post(`/api/v1/projects/${id}/site/reports`).set(auth).send(reportPayload))
      .status,
  ).toBe(409);
  const delay = await request(app).post(`/api/v1/projects/${id}/site/delays`).set(auth).send({
    date: '2026-09-28',
    cause: 'Safety hold',
    daysDelayed: 1,
    impact: 'Handover paused',
    correctiveAction: '',
    critical: true,
    workItemId: task.body.data.id,
  });
  expect(delay.status).toBe(201);
  expect(
    (
      await request(app)
        .patch(`/api/v1/projects/${id}/status`)
        .set(auth)
        .send({ status: 'COMPLETED' })
    ).status,
  ).toBe(409);
  expect(
    (
      await request(app)
        .patch(`/api/v1/projects/${id}/site/delays/${delay.body.data.id}`)
        .set(auth)
        .send({ status: 'RESOLVED', correctiveAction: 'Safety hold cleared.', version: 1 })
    ).status,
  ).toBe(200);
  expect(
    (
      await request(app)
        .patch(`/api/v1/projects/${id}/status`)
        .set(auth)
        .send({ status: 'COMPLETED' })
    ).status,
  ).toBe(200);
  expect(
    (await request(app).patch(`/api/v1/projects/${id}/status`).set(auth).send({ status: 'CLOSED' }))
      .status,
  ).toBe(409);
  await db.document.create({
    data: {
      organizationId: adminOrg,
      projectId: id,
      title: 'Project handover pack',
      category: 'Handover',
      versions: {
        create: {
          version: 1,
          filename: 'handover.pdf',
          mimeType: 'application/pdf',
          size: 10,
          storagePath: 'integration-only',
          checksum: '0'.repeat(64),
          uploadedById: admin.id,
        },
      },
    },
  });
  expect(
    (await request(app).patch(`/api/v1/projects/${id}/status`).set(auth).send({ status: 'CLOSED' }))
      .status,
  ).toBe(200);
  expect((await request(app).patch(`/api/v1/projects/${id}`).set(auth).send(payload)).status).toBe(
    409,
  );
  const filtered = await request(app)
    .get('/api/v1/projects?search=Integration&status=CLOSED')
    .set(auth);
  expect(filtered.body.data).toHaveLength(1);
  const search = await request(app).get('/api/v1/search?q=Integration').set(auth);
  expect(search.status).toBe(200);
  expect(search.body.data).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ category: 'Project', id, route: `/projects/${id}` }),
    ]),
  );
  expect(
    (
      await request(app)
        .get('/api/v1/search?q=Integration')
        .set('Authorization', `Bearer ${clientToken}`)
    ).body.data,
  ).toHaveLength(0);
  const storedAttachment = await db.siteReportAttachment.findUniqueOrThrow({
    where: { id: attachment.body.data.id },
  });
  await db.project.delete({ where: { id } });
  await unlink(storedAttachment.storagePath).catch(() => undefined);
  await db.user.delete({ where: { id: assigned.id } });
});

test('equipment allocation prevents overlaps and preserves release and maintenance history', async () => {
  const auth = { Authorization: `Bearer ${adminToken}` };
  const project = await db.project.create({
    data: {
      organizationId: adminOrg,
      code: 'BT-EQUIP-001',
      name: 'Equipment Test',
      category: 'Infrastructure',
      address: 'Equipment site',
      city: 'Pune',
      state: 'Maharashtra',
      startDate: new Date('2026-09-01'),
      endDate: new Date('2027-12-31'),
      budget: '1000000',
      estimatedCost: '900000',
      members: {
        create: {
          userId: (await db.user.findUniqueOrThrow({ where: { email: 'admin@integration.test' } }))
            .id,
        },
      },
    },
  });
  const created = await request(app).post('/api/v1/equipment').set(auth).send({
    code: 'EX-101',
    name: 'Excavator 101',
    type: 'Excavator',
    location: 'Central yard',
    hourlyRate: '1800.50',
    commissionedAt: '2024-01-15',
    serviceIntervalDays: 120,
    notes: '',
    status: 'AVAILABLE',
  });
  expect(created.status).toBe(201);
  const equipmentId = created.body.data.id;
  const allocationPayload = {
    projectId: project.id,
    operatorId: null,
    startAt: '2026-10-01T08:00:00.000Z',
    endAt: '2026-10-10T18:00:00.000Z',
    notes: 'Foundation excavation',
  };
  const allocation = await request(app)
    .post(`/api/v1/equipment/${equipmentId}/allocations`)
    .set(auth)
    .send(allocationPayload);
  expect(allocation.status).toBe(201);
  expect(
    (
      await request(app)
        .post(`/api/v1/equipment/${equipmentId}/allocations`)
        .set(auth)
        .send({ ...allocationPayload, startAt: '2026-10-05T08:00:00.000Z' })
    ).status,
  ).toBe(409);
  expect(
    (
      await request(app).post(`/api/v1/equipment/${equipmentId}/maintenance`).set(auth).send({
        type: 'Preventive service',
        scheduledAt: '2026-10-05T10:00:00.000Z',
        priority: 'HIGH',
        notes: '',
      })
    ).status,
  ).toBe(409);
  expect(
    (
      await request(app)
        .patch(`/api/v1/equipment/${equipmentId}/allocations/${allocation.body.data.id}/release`)
        .set(auth)
        .send({})
    ).status,
  ).toBe(200);
  const maintenance = await request(app)
    .post(`/api/v1/equipment/${equipmentId}/maintenance`)
    .set(auth)
    .send({
      type: 'Corrective hydraulic repair',
      scheduledAt: '2026-10-05T10:00:00.000Z',
      priority: 'HIGH',
      failureRelated: true,
      downtimeHours: '6.5',
      notes: '',
    });
  expect(maintenance.status).toBe(201);
  const start = await request(app)
    .patch(`/api/v1/equipment/${equipmentId}/maintenance/${maintenance.body.data.id}`)
    .set(auth)
    .send({ status: 'IN_PROGRESS', version: 1 });
  expect(start.status).toBe(200);
  expect(
    (
      await request(app)
        .patch(`/api/v1/equipment/${equipmentId}/maintenance/${maintenance.body.data.id}`)
        .set(auth)
        .send({ status: 'COMPLETED', version: start.body.data.version })
    ).status,
  ).toBe(200);
  const directory = await request(app).get('/api/v1/equipment').set(auth);
  expect(directory.body.data.summary.total).toBe(1);
  expect(directory.body.data.history).toHaveLength(12);
  expect(
    directory.body.data.history.some(
      (point: { allocatedHours: number }) => point.allocatedHours > 0,
    ),
  ).toBe(true);
  expect(directory.body.data.records[0].utilizationHistory).toHaveLength(12);
  expect(directory.body.data.records[0].maintenance).toHaveLength(0);
  expect(await db.equipmentAllocation.count({ where: { equipmentId } })).toBe(1);
  expect(await db.maintenanceRecord.count({ where: { equipmentId } })).toBe(1);
  expect(await db.maintenanceRecord.findFirstOrThrow({ where: { equipmentId } })).toMatchObject({
    failureRelated: true,
  });
  await db.maintenanceRecord.deleteMany({ where: { equipmentId } });
  await db.equipmentAllocation.deleteMany({ where: { equipmentId } });
  await db.equipment.delete({ where: { id: equipmentId } });
  await db.project.delete({ where: { id: project.id } });
});

test('inventory allocation is transactional and never oversubscribes stock', async () => {
  const auth = { Authorization: `Bearer ${adminToken}` };
  const admin = await db.user.findUniqueOrThrow({ where: { email: 'admin@integration.test' } });
  const project = await db.project.create({
    data: {
      organizationId: adminOrg,
      code: 'BT-STOCK-001',
      name: 'Stock Test',
      category: 'Residential',
      address: 'Stock site',
      city: 'Pune',
      state: 'Maharashtra',
      startDate: new Date('2026-09-01'),
      endDate: new Date('2027-12-31'),
      budget: '1000000',
      estimatedCost: '900000',
      members: { create: { userId: admin.id } },
    },
  });
  const material = await request(app).post('/api/v1/inventory/materials').set(auth).send({
    sku: 'CEM-001',
    name: 'OPC Cement',
    category: 'Cement',
    unit: 'bags',
    currentStock: '100',
    minimumLevel: '30',
    criticalLevel: '10',
    unitCost: '420.50',
    supplier: 'Test Supplier',
  });
  expect(material.status).toBe(201);
  const createRequest = (quantity: string) =>
    request(app).post('/api/v1/inventory/requests').set(auth).send({
      projectId: project.id,
      materialId: material.body.data.id,
      quantity,
      requiredDate: '2026-10-10',
      purpose: 'Foundation work',
      status: 'SUBMITTED',
    });
  const first = await createRequest('80'),
    second = await createRequest('30');
  expect(first.status).toBe(201);
  expect(second.status).toBe(201);
  const transition = (id: string, status: string, version: number) =>
    request(app)
      .patch(`/api/v1/inventory/requests/${id}/status`)
      .set(auth)
      .send({ status, decisionNote: 'Integration decision', version });
  const firstApproved = await transition(first.body.data.id, 'APPROVED', 1),
    secondApproved = await transition(second.body.data.id, 'APPROVED', 1);
  expect(firstApproved.status).toBe(200);
  expect(secondApproved.status).toBe(200);
  const firstAllocated = await transition(
    first.body.data.id,
    'ALLOCATED',
    firstApproved.body.data.version,
  );
  expect(firstAllocated.status).toBe(200);
  expect(
    (await transition(second.body.data.id, 'ALLOCATED', secondApproved.body.data.version)).status,
  ).toBe(409);
  expect(
    (await transition(first.body.data.id, 'FULFILLED', firstAllocated.body.data.version)).status,
  ).toBe(200);
  const stored = await db.material.findUniqueOrThrow({ where: { id: material.body.data.id } });
  expect(stored.currentStock.toString()).toBe('20');
  expect(stored.allocatedStock.toString()).toBe('0');
  expect(await db.stockMovement.count({ where: { materialId: stored.id } })).toBe(3);
  await db.stockMovement.deleteMany({ where: { materialId: stored.id } });
  await db.materialRequest.deleteMany({ where: { materialId: stored.id } });
  await db.material.delete({ where: { id: stored.id } });
  await db.project.delete({ where: { id: project.id } });
});

test('workforce enforces assignment, attendance uniqueness, shift overlap and payroll estimates', async () => {
  const admin = await db.user.findUniqueOrThrow({ where: { email: 'admin@integration.test' } });
  const project = await db.project.create({
    data: {
      organizationId: adminOrg,
      code: 'BT-WORKFORCE-TEST',
      name: 'Workforce Integration Project',
      category: 'Commercial',
      address: 'Workforce site',
      city: 'Pune',
      state: 'Maharashtra',
      startDate: new Date('2026-09-01'),
      endDate: new Date('2027-12-31'),
      budget: '1000000',
      estimatedCost: '900000',
      members: { create: { userId: admin.id } },
    },
  });
  const auth = { Authorization: `Bearer ${adminToken}` };
  const created = await request(app).post('/api/v1/workforce/workers').set(auth).send({
    employeeCode: 'EMP-TEST-01',
    name: 'Integration Mason',
    category: 'Mason',
    phone: '+91 90000 00000',
    hourlyRate: '250',
    status: 'ACTIVE',
    userId: null,
  });
  expect(created.status).toBe(201);
  const workerId = created.body.data.id;
  const unassigned = await request(app).post('/api/v1/workforce/attendance').set(auth).send({
    workerId,
    projectId: project.id,
    workDate: '2026-09-28',
    status: 'PRESENT',
    hours: '8',
    approved: true,
    notes: '',
  });
  expect(unassigned.status).toBe(409);
  const assigned = await request(app)
    .post(`/api/v1/workforce/workers/${workerId}/assignments`)
    .set(auth)
    .send({ projectId: project.id, startDate: '2026-09-01', endDate: null, role: 'Mason' });
  expect(assigned.status).toBe(201);
  const attendance = await request(app).post('/api/v1/workforce/attendance').set(auth).send({
    workerId,
    projectId: project.id,
    workDate: '2026-09-28',
    status: 'PRESENT',
    hours: '8',
    approved: true,
    notes: 'Foundation work',
  });
  expect(attendance.status).toBe(201);
  expect(
    (
      await request(app).post('/api/v1/workforce/attendance').set(auth).send({
        workerId,
        projectId: project.id,
        workDate: '2026-09-28',
        status: 'PRESENT',
        hours: '7',
        approved: false,
        notes: '',
      })
    ).status,
  ).toBe(409);
  const shift = {
    workerId,
    projectId: project.id,
    startAt: '2026-10-01T03:30:00.000Z',
    endAt: '2026-10-01T11:30:00.000Z',
    location: 'Tower A',
    notes: '',
  };
  expect((await request(app).post('/api/v1/workforce/shifts').set(auth).send(shift)).status).toBe(
    201,
  );
  expect(
    (
      await request(app)
        .post('/api/v1/workforce/shifts')
        .set(auth)
        .send({ ...shift, startAt: '2026-10-01T10:00:00.000Z', endAt: '2026-10-01T14:00:00.000Z' })
    ).status,
  ).toBe(409);
  const dashboard = await request(app).get('/api/v1/workforce').set(auth);
  expect(dashboard.status).toBe(200);
  expect(
    dashboard.body.data.payroll.find((row: { workerId: string }) => row.workerId === workerId),
  ).toMatchObject({
    approvedHours: '8',
    estimatedPay: '2000',
  });
  await db.shift.deleteMany({ where: { workerId } });
  await db.attendance.deleteMany({ where: { workerId } });
  await db.workerProjectAssignment.deleteMany({ where: { workerId } });
  await db.workerProfile.delete({ where: { id: workerId } });
  await db.project.delete({ where: { id: project.id } });
});

test('procurement approval, order math, idempotent partial receipts and invoices update stock', async () => {
  const admin = await db.user.findUniqueOrThrow({ where: { email: 'admin@integration.test' } });
  const project = await db.project.create({
    data: {
      organizationId: adminOrg,
      code: 'BT-PROC-TEST',
      name: 'Procurement Integration',
      category: 'Commercial',
      address: 'Procurement site',
      city: 'Pune',
      state: 'Maharashtra',
      startDate: new Date('2026-09-01'),
      endDate: new Date('2027-12-31'),
      budget: '1000000',
      estimatedCost: '900000',
      members: { create: { userId: admin.id } },
    },
  });
  const material = await db.material.create({
    data: {
      organizationId: adminOrg,
      sku: 'PROC-TEST-01',
      name: 'Procurement Cement',
      category: 'Cement',
      unit: 'bags',
      currentStock: '10',
      minimumLevel: '5',
      criticalLevel: '2',
      unitCost: '400',
    },
  });
  const auth = { Authorization: `Bearer ${adminToken}` };
  const vendor = await request(app).post('/api/v1/procurement/vendors').set(auth).send({
    code: 'VEN-TEST-01',
    name: 'Integration Supplier',
    contactName: 'Supplier Contact',
    email: 'supplier@example.test',
    phone: '',
    address: '',
    status: 'ACTIVE',
  });
  expect(vendor.status).toBe(201);
  const procurement = await request(app).post('/api/v1/procurement/requests').set(auth).send({
    projectId: project.id,
    materialId: material.id,
    quantity: '20',
    requiredDate: '2026-10-15',
    justification: 'Foundation concrete',
    status: 'SUBMITTED',
  });
  expect(procurement.status).toBe(201);
  const approved = await request(app)
    .patch(`/api/v1/procurement/requests/${procurement.body.data.id}/status`)
    .set(auth)
    .send({
      status: 'APPROVED',
      decisionNote: 'Approved for site work.',
      version: procurement.body.data.version,
    });
  expect(approved.status).toBe(200);
  const order = await request(app).post('/api/v1/procurement/orders').set(auth).send({
    requestId: procurement.body.data.id,
    vendorId: vendor.body.data.id,
    number: 'PO-TEST-001',
    unitPrice: '100',
    taxRate: '18',
    expectedDate: '2026-10-15',
    notes: '',
  });
  expect(order.status).toBe(201);
  expect(order.body.data).toMatchObject({ subtotal: '2000', taxAmount: '360', total: '2360' });
  const firstReceipt = {
    receiptNumber: 'GRN-TEST-001',
    idempotencyKey: '11111111-1111-4111-8111-111111111111',
    quantity: '8',
    receivedAt: '2026-09-28T08:00:00.000Z',
    note: 'First truck',
  };
  expect(
    (
      await request(app)
        .post(`/api/v1/procurement/orders/${order.body.data.id}/receipts`)
        .set(auth)
        .send(firstReceipt)
    ).status,
  ).toBe(201);
  const replay = await request(app)
    .post(`/api/v1/procurement/orders/${order.body.data.id}/receipts`)
    .set(auth)
    .send(firstReceipt);
  expect(replay.status).toBe(200);
  expect(replay.body.message).toBe('Receipt already recorded.');
  expect(
    (
      await request(app)
        .post(`/api/v1/procurement/orders/${order.body.data.id}/receipts`)
        .set(auth)
        .send({
          ...firstReceipt,
          receiptNumber: 'GRN-TEST-002',
          idempotencyKey: '22222222-2222-4222-8222-222222222222',
          quantity: '12',
        })
    ).status,
  ).toBe(201);
  const storedMaterial = await db.material.findUniqueOrThrow({ where: { id: material.id } });
  expect(storedMaterial.currentStock.toString()).toBe('30');
  expect(
    await db.stockMovement.count({
      where: { materialId: material.id, procurementReceiptId: { not: null } },
    }),
  ).toBe(2);
  expect(
    (await db.purchaseOrder.findUniqueOrThrow({ where: { id: order.body.data.id } })).status,
  ).toBe('RECEIVED');
  expect(
    (
      await request(app).post('/api/v1/procurement/invoices').set(auth).send({
        purchaseOrderId: order.body.data.id,
        invoiceNumber: 'INV-OVER',
        invoiceDate: '2026-09-28',
        dueDate: '2026-10-28',
        amount: '2400',
        notes: '',
      })
    ).status,
  ).toBe(409);
  const invoice = await request(app).post('/api/v1/procurement/invoices').set(auth).send({
    purchaseOrderId: order.body.data.id,
    invoiceNumber: 'INV-TEST-001',
    invoiceDate: '2026-09-28',
    dueDate: '2026-10-28',
    amount: '2360',
    notes: '',
  });
  expect(invoice.status).toBe(201);
  expect(
    (
      await request(app)
        .patch(`/api/v1/procurement/invoices/${invoice.body.data.id}/status`)
        .set(auth)
        .send({ status: 'VERIFIED', version: invoice.body.data.version })
    ).status,
  ).toBe(200);
  await db.stockMovement.deleteMany({ where: { materialId: material.id } });
  await db.invoice.deleteMany({ where: { purchaseOrderId: order.body.data.id } });
  await db.goodsReceipt.deleteMany({ where: { purchaseOrderId: order.body.data.id } });
  await db.purchaseOrder.delete({ where: { id: order.body.data.id } });
  await db.procurementRequest.delete({ where: { id: procurement.body.data.id } });
  await db.vendor.delete({ where: { id: vendor.body.data.id } });
  await db.material.delete({ where: { id: material.id } });
  await db.project.delete({ where: { id: project.id } });
});

test('finance enforces category caps, currency and duplicate sources while reconciling commitments', async () => {
  const admin = await db.user.findUniqueOrThrow({ where: { email: 'admin@integration.test' } });
  const project = await db.project.create({
    data: {
      organizationId: adminOrg,
      code: 'BT-FIN-TEST',
      name: 'Finance Integration',
      category: 'Commercial',
      address: 'Finance site',
      city: 'Pune',
      state: 'Maharashtra',
      startDate: new Date('2026-09-01'),
      endDate: new Date('2027-12-31'),
      budget: '1000',
      estimatedCost: '900',
      members: { create: { userId: admin.id } },
    },
  });
  const material = await db.material.create({
    data: {
      organizationId: adminOrg,
      sku: 'FIN-TEST-01',
      name: 'Finance Material',
      category: 'Other',
      unit: 'units',
      currentStock: '0',
      minimumLevel: '0',
      criticalLevel: '0',
      unitCost: '10',
    },
  });
  const vendor = await db.vendor.create({
    data: { organizationId: adminOrg, code: 'FIN-VENDOR', name: 'Finance Vendor' },
  });
  const procurement = await db.procurementRequest.create({
    data: {
      projectId: project.id,
      materialId: material.id,
      requesterId: admin.id,
      approvedById: admin.id,
      quantity: '10',
      requiredDate: new Date('2026-10-15'),
      justification: 'Committed materials',
      status: 'ORDERED',
    },
  });
  const order = await db.purchaseOrder.create({
    data: {
      organizationId: adminOrg,
      number: 'PO-FIN-001',
      requestId: procurement.id,
      vendorId: vendor.id,
      materialId: material.id,
      quantity: '10',
      unitPrice: '30',
      taxRate: '0',
      subtotal: '300',
      taxAmount: '0',
      total: '300',
      expectedDate: new Date('2026-10-15'),
      createdById: admin.id,
    },
  });
  const auth = { Authorization: `Bearer ${adminToken}` };
  expect(
    (
      await request(app)
        .post('/api/v1/finance/budgets')
        .set(auth)
        .send({ projectId: project.id, category: 'Materials', amount: '700', notes: '' })
    ).status,
  ).toBe(201);
  expect(
    (
      await request(app)
        .post('/api/v1/finance/budgets')
        .set(auth)
        .send({ projectId: project.id, category: 'Labour', amount: '400', notes: '' })
    ).status,
  ).toBe(409);
  const baseExpense = {
    projectId: project.id,
    vendorId: vendor.id,
    category: 'Site services',
    description: 'Temporary utilities',
    amount: '100',
    currency: 'INR',
    expenseDate: '2026-09-28',
    sourceRef: 'FIN-SOURCE-001',
    notes: '',
  };
  expect(
    (
      await request(app)
        .post('/api/v1/finance/expenses')
        .set(auth)
        .send({ ...baseExpense, currency: 'USD' })
    ).status,
  ).toBe(422);
  const expense = await request(app).post('/api/v1/finance/expenses').set(auth).send(baseExpense);
  expect(expense.status).toBe(201);
  expect(
    (await request(app).post('/api/v1/finance/expenses').set(auth).send(baseExpense)).status,
  ).toBe(409);
  expect(
    (
      await request(app)
        .patch(`/api/v1/finance/expenses/${expense.body.data.id}/status`)
        .set(auth)
        .send({ status: 'APPROVED', version: expense.body.data.version })
    ).status,
  ).toBe(200);
  const dashboard = await request(app).get('/api/v1/finance').set(auth);
  const row = dashboard.body.data.projects.find((item: { id: string }) => item.id === project.id);
  expect(row).toMatchObject({
    actual: '100',
    commitment: '300',
    forecast: '400',
    remaining: '600',
  });
  await db.expense.deleteMany({ where: { projectId: project.id } });
  await db.budgetAllocation.deleteMany({ where: { projectId: project.id } });
  await db.purchaseOrder.delete({ where: { id: order.id } });
  await db.procurementRequest.delete({ where: { id: procurement.id } });
  await db.vendor.delete({ where: { id: vendor.id } });
  await db.material.delete({ where: { id: material.id } });
  await db.project.delete({ where: { id: project.id } });
});

test('documents enforce signatures and project scope while notifications and real exports work', async () => {
  const admin = await db.user.findUniqueOrThrow({ where: { email: 'admin@integration.test' } });
  const member = await db.user.create({
    data: {
      organizationId: adminOrg,
      name: 'Document Recipient',
      email: 'document-recipient@integration.test',
      passwordHash: await bcrypt.hash(password, 12),
      role: 'PROJECT_MANAGER',
    },
  });
  const project = await db.project.create({
    data: {
      organizationId: adminOrg,
      code: 'BT-DOC-TEST',
      name: 'Document Integration',
      category: 'Commercial',
      address: 'Document site',
      city: 'Pune',
      state: 'Maharashtra',
      startDate: new Date('2026-09-01'),
      endDate: new Date('2027-12-31'),
      budget: '1000000',
      estimatedCost: '900000',
      members: { create: [{ userId: admin.id }, { userId: member.id }] },
    },
  });
  const auth = { Authorization: `Bearer ${adminToken}` };
  const fake = await request(app)
    .post('/api/v1/documents')
    .set(auth)
    .field('projectId', project.id)
    .field('title', 'Unsafe file')
    .field('category', 'Other')
    .attach('file', Buffer.from('not a pdf'), {
      filename: 'unsafe.pdf',
      contentType: 'application/pdf',
    });
  expect(fake.status).toBe(422);
  const upload = await request(app)
    .post('/api/v1/documents')
    .set(auth)
    .field('projectId', project.id)
    .field('title', 'Approved drawing')
    .field('category', 'Drawing')
    .attach('file', Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF'), {
      filename: 'drawing.pdf',
      contentType: 'application/pdf',
    });
  expect(upload.status).toBe(201);
  const version = upload.body.data.versions[0];
  expect(version.version).toBe(1);
  expect(
    await db.notification.count({ where: { userId: member.id, type: 'DOCUMENT_UPLOADED' } }),
  ).toBe(1);
  const download = await request(app)
    .get(`/api/v1/documents/versions/${version.id}/download`)
    .set(auth)
    .buffer(true)
    .parse((response, callback) => {
      const chunks: Buffer[] = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => callback(null, Buffer.concat(chunks)));
    });
  expect(download.status).toBe(200);
  expect((download.body as Buffer).subarray(0, 4).toString()).toBe('%PDF');
  const preview = await request(app)
    .get(`/api/v1/documents/versions/${version.id}/preview`)
    .set(auth);
  expect(preview.status).toBe(200);
  expect(preview.headers['content-disposition']).toContain('inline');
  const pdf = await request(app)
    .get(`/api/v1/reports/project-summary.pdf?projectId=${project.id}`)
    .set(auth)
    .buffer(true)
    .parse((response, callback) => {
      const chunks: Buffer[] = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => callback(null, Buffer.concat(chunks)));
    });
  expect(pdf.status).toBe(200);
  expect(pdf.headers['content-type']).toContain('application/pdf');
  expect((pdf.body as Buffer).subarray(0, 4).toString()).toBe('%PDF');
  const xlsx = await request(app)
    .get(`/api/v1/reports/expenses.xlsx?projectId=${project.id}`)
    .set(auth)
    .buffer(true)
    .parse((response, callback) => {
      const chunks: Buffer[] = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => callback(null, Buffer.concat(chunks)));
    });
  expect(xlsx.status).toBe(200);
  expect((xlsx.body as Buffer).subarray(0, 2).toString()).toBe('PK');
  await db.notification.deleteMany({ where: { userId: member.id } });
  const deleted = await request(app).delete(`/api/v1/documents/${upload.body.data.id}`).set(auth);
  expect(deleted.status).toBe(200);
  expect(await db.document.findUnique({ where: { id: upload.body.data.id } })).toBeNull();
  await db.project.delete({ where: { id: project.id } });
  await db.user.delete({ where: { id: member.id } });
});

test('analytics reconciles project controls and keeps demo integrations explicitly non-live', async () => {
  const admin = await db.user.findUniqueOrThrow({ where: { email: 'admin@integration.test' } });
  const project = await db.project.create({
    data: {
      organizationId: adminOrg,
      code: 'BT-ANALYTICS-TEST',
      name: 'Analytics Integration',
      category: 'Commercial',
      address: 'Analytics site',
      city: 'Pune',
      state: 'Maharashtra',
      startDate: new Date('2026-09-01'),
      endDate: new Date('2027-12-31'),
      budget: '1000',
      estimatedCost: '900',
      members: { create: { userId: admin.id } },
    },
  });
  const item = await db.workItem.create({
    data: {
      projectId: project.id,
      kind: 'MILESTONE',
      name: 'Overdue milestone',
      startDate: new Date('2026-09-01'),
      plannedDate: new Date('2026-09-10'),
      status: 'IN_PROGRESS',
      progress: 20,
    },
  });
  await db.siteDelay.create({
    data: {
      projectId: project.id,
      reporterId: admin.id,
      workItemId: item.id,
      date: new Date('2026-09-20'),
      cause: 'Material delay',
      daysDelayed: 3,
      impact: 'Schedule risk',
      critical: true,
    },
  });
  await db.inspection.create({
    data: {
      projectId: project.id,
      inspectorId: admin.id,
      date: new Date('2026-09-20'),
      location: 'Tower A',
      type: 'Quality',
      result: 'FAILED',
      findings: 'Correction required',
    },
  });
  await db.expense.create({
    data: {
      organizationId: adminOrg,
      projectId: project.id,
      category: 'Site',
      description: 'Approved test expense',
      amount: '100',
      currency: 'INR',
      expenseDate: new Date('2026-09-20'),
      sourceRef: 'ANALYTICS-EXP-1',
      status: 'APPROVED',
      createdById: admin.id,
      approvedById: admin.id,
    },
  });
  const auth = { Authorization: `Bearer ${adminToken}` };
  const dashboard = await request(app).get('/api/v1/analytics').set(auth);
  expect(dashboard.status).toBe(200);
  const row = dashboard.body.data.projects.find(
    (record: { id: string }) => record.id === project.id,
  );
  expect(row).toMatchObject({
    progress: 20,
    overdue: 1,
    criticalDelays: 1,
    unresolvedInspections: 1,
    actual: '100',
    riskScore: 57,
    insight: 'Immediate review recommended',
  });
  const weather = await request(app)
    .get(`/api/v1/analytics/projects/${project.id}/weather`)
    .set(auth);
  expect(weather.body.data).toMatchObject({
    live: false,
    provider: 'DEMO',
    label: 'Demonstration weather — not live',
  });
  const cameras = await request(app)
    .get(`/api/v1/analytics/projects/${project.id}/camera-feeds`)
    .set(auth);
  expect(cameras.body.data).toMatchObject({ live: false, provider: 'UNCONFIGURED', feeds: [] });
  const ml = await request(app).get('/api/v1/ml').set(auth);
  expect(ml.status).toBe(200);
  expect(ml.body.data.scheduleDelay).toMatchObject({
    model: 'Organization-scoped logistic regression',
    version: 'schedule-delay-v1',
  });
  expect(ml.body.data.materialDemand).toMatchObject({
    model: 'Exponentially weighted weekly demand',
    version: 'material-demand-v1',
  });
  expect(ml.body.data.costAtCompletion).toMatchObject({
    model: 'Organization-scoped ridge regression',
    version: 'cost-completion-v1',
  });
  expect(ml.body.data.equipmentMaintenance).toMatchObject({
    model: 'Organization-scoped logistic failure classifier',
    version: 'equipment-maintenance-v1',
  });
  const isolated = await request(app)
    .get('/api/v1/analytics')
    .set('Authorization', `Bearer ${clientToken}`);
  expect(isolated.body.data.projects).toHaveLength(0);
  const isolatedMl = await request(app)
    .get('/api/v1/ml')
    .set('Authorization', `Bearer ${clientToken}`);
  expect(isolatedMl.body.data.scheduleDelay.trainingSamples).toBe(0);
  expect(isolatedMl.body.data.costAtCompletion.trainingSamples).toBe(0);
  expect(isolatedMl.body.data.materialDemand).toBeNull();
  expect(isolatedMl.body.data.equipmentMaintenance).toBeNull();
  await db.expense.deleteMany({ where: { projectId: project.id } });
  await db.inspection.deleteMany({ where: { projectId: project.id } });
  await db.siteDelay.deleteMany({ where: { projectId: project.id } });
  await db.workItem.deleteMany({ where: { projectId: project.id } });
  await db.project.delete({ where: { id: project.id } });
});

test('rejects role injection, weak passwords and unknown profile fields', async () => {
  expect(
    (
      await request(app).post('/api/v1/auth/register').send({
        name: 'Intruder',
        email: 'intruder@integration.test',
        company: 'Test',
        password,
        role: 'ADMINISTRATOR',
      })
    ).status,
  ).toBe(422);
  expect(
    (
      await request(app).post('/api/v1/auth/register').send({
        name: 'Intruder',
        email: 'intruder@integration.test',
        company: 'Test',
        password: 'weak',
      })
    ).status,
  ).toBe(422);
  expect(
    (
      await request(app)
        .patch('/api/v1/auth/me')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ name: 'Client', role: 'ADMINISTRATOR' })
    ).status,
  ).toBe(422);
});
test('duplicate registration rolls back its organization', async () => {
  const count = await db.organization.count();
  expect(
    (
      await request(app).post('/api/v1/auth/register').send({
        name: 'Duplicate Client',
        email: 'client@integration.test',
        company: 'Should roll back',
        password,
      })
    ).status,
  ).toBe(409);
  expect(await db.organization.count()).toBe(count);
});
test('invalid credentials and forged tokens are rejected', async () => {
  expect(
    (
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'client@integration.test', password: 'WrongPassword2026!' })
    ).status,
  ).toBe(401);
  expect((await request(app).get('/api/v1/auth/me')).status).toBe(401);
  expect(
    (await request(app).get('/api/v1/auth/me').set('Authorization', 'Bearer invalid.token.value'))
      .status,
  ).toBe(401);
});
test('enforces admin permission and scopes directory to organization', async () => {
  expect(
    (await request(app).get('/api/v1/users').set('Authorization', `Bearer ${clientToken}`)).status,
  ).toBe(403);
  const users = await request(app)
    .get('/api/v1/users')
    .set('Authorization', `Bearer ${adminToken}`);
  expect(users.status).toBe(200);
  expect(users.body.data).toHaveLength(1);
  expect(users.body.data[0].email).toBe('admin@integration.test');
  const page = await request(app)
    .get('/api/v1/users?page=1&limit=1&sort=name&direction=asc')
    .set('Authorization', `Bearer ${adminToken}`);
  expect(page.body.meta).toMatchObject({ page: 1, limit: 1, total: 1, totalPages: 1 });
});
test('profile updates persist without exposing password hashes', async () => {
  const response = await request(app)
    .patch('/api/v1/auth/me')
    .set('Authorization', `Bearer ${clientToken}`)
    .send({ name: 'Priya Updated', phone: '+91 98765 43210' });
  expect(response.status).toBe(200);
  expect(response.body.data.name).toBe('Priya Updated');
  expect(response.body.data.passwordHash).toBeUndefined();
  expect((await db.user.findUniqueOrThrow({ where: { id: clientId } })).phone).toBe(
    '+91 98765 43210',
  );
});
test('overview contains database session counts and only own activity', async () => {
  const response = await request(app)
    .get('/api/v1/account/overview')
    .set('Authorization', `Bearer ${clientToken}`);
  expect(response.status).toBe(200);
  expect(response.body.data.sessions).toBeGreaterThan(0);
  expect(
    response.body.data.activity.some((a: { action: string }) => a.action === 'PROFILE_UPDATED'),
  ).toBe(true);
  const expected = await db.auditLog.count({ where: { actorId: clientId } });
  expect(response.body.data.activity).toHaveLength(Math.min(expected, 8));
});
test('rotates refresh tokens, revokes the token family on reuse, checks origin and logs out', async () => {
  const login = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'client@integration.test', password });
  const cookie = login.headers['set-cookie'] as unknown as string[];
  expect(String(cookie)).toContain('HttpOnly');
  expect(String(cookie)).toContain('SameSite=Strict');
  expect((await request(app).post('/api/v1/auth/refresh').set('Cookie', cookie)).status).toBe(403);
  const rotated = await request(app)
    .post('/api/v1/auth/refresh')
    .set(browser)
    .set('Cookie', cookie);
  expect(rotated.status).toBe(200);
  expect(
    (await request(app).post('/api/v1/auth/refresh').set(browser).set('Cookie', cookie)).status,
  ).toBe(401);
  expect(
    (
      await request(app)
        .post('/api/v1/auth/refresh')
        .set(browser)
        .set('Cookie', rotated.headers['set-cookie'] as unknown as string[])
    ).status,
  ).toBe(401);
  expect(
    (
      await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${rotated.body.data.accessToken}`)
    ).status,
  ).toBe(401);
  const nextLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'client@integration.test', password });
  expect(
    (
      await request(app)
        .post('/api/v1/auth/logout')
        .set(browser)
        .set('Cookie', nextLogin.headers['set-cookie'] as unknown as string[])
    ).status,
  ).toBe(200);
  expect(
    (
      await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${nextLogin.body.data.accessToken}`)
    ).status,
  ).toBe(401);
});
test('inactive users cannot log in or keep an existing session', async () => {
  await db.user.update({ where: { id: clientId }, data: { active: false } });
  expect(
    (
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'client@integration.test', password })
    ).status,
  ).toBe(401);
  expect(
    (await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${clientToken}`))
      .status,
  ).toBe(401);
  await db.user.update({ where: { id: clientId }, data: { active: true } });
});
test('reset request responses do not reveal account existence or tokens', async () => {
  const known = await request(app)
    .post('/api/v1/auth/forgot-password')
    .send({ email: 'client@integration.test' });
  const unknown = await request(app)
    .post('/api/v1/auth/forgot-password')
    .send({ email: 'missing@integration.test' });
  expect(known.status).toBe(202);
  expect(known.body).toEqual(unknown.body);
  expect(JSON.stringify(known.body)).not.toContain('token');
});
test('delivered reset link is single-use even with concurrent submissions; revokes sessions', async () => {
  const record = await db.passwordReset.findFirstOrThrow({
    where: { userId: clientId, usedAt: null },
    orderBy: { createdAt: 'desc' },
  });
  const mail = JSON.parse(await readFile(`.local/mail/${record.id}.json`, 'utf8')) as {
    to: string;
    text: string;
  };
  expect(mail.to).toBe('client@integration.test');
  const token = mail.text.match(/token=([a-f0-9]{64})/)?.[1] || '';
  expect(token).toHaveLength(64);
  const responses = await Promise.all(
    [1, 2].map(() =>
      request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token, password: 'UpdatedFoundation2026!' }),
    ),
  );
  expect(responses.map((r) => r.status).sort()).toEqual([200, 400]);
  expect(
    (await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${clientToken}`))
      .status,
  ).toBe(401);
  expect(
    (
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'client@integration.test', password })
    ).status,
  ).toBe(401);
  expect(
    (
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'client@integration.test', password: 'UpdatedFoundation2026!' })
    ).status,
  ).toBe(200);
});
test('expired reset tokens cannot change credentials', async () => {
  const token = newToken();
  await db.passwordReset.create({
    data: {
      userId: clientId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() - 60000),
    },
  });
  expect(
    (await request(app).post('/api/v1/auth/reset-password').send({ token, password })).status,
  ).toBe(400);
});
test('password change verifies current password and invalidates existing sessions', async () => {
  const login = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'client@integration.test', password: 'UpdatedFoundation2026!' });
  const auth = `Bearer ${login.body.data.accessToken}`;
  expect(
    (
      await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', auth)
        .send({ currentPassword: 'WrongPassword2026!', password })
    ).status,
  ).toBe(400);
  expect(
    (
      await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', auth)
        .send({ currentPassword: 'UpdatedFoundation2026!', password })
    ).status,
  ).toBe(200);
  expect((await request(app).get('/api/v1/auth/me').set('Authorization', auth)).status).toBe(401);
});
test('readiness checks database; unknown routes and invalid JSON have safe errors', async () => {
  expect((await request(app).get('/api/ready')).status).toBe(200);
  expect((await request(app).get('/api/v1/missing')).status).toBe(404);
  const invalid = await request(app)
    .post('/api/v1/auth/login')
    .set('Content-Type', 'application/json')
    .send('{broken');
  expect(invalid.status).toBe(400);
  expect(invalid.body.success).toBe(false);
});

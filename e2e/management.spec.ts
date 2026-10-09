import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import bcrypt from 'bcryptjs';
import { unlink } from 'node:fs/promises';
config({ path: 'backend/.env', quiet: true });
const db = new PrismaClient();
const password = 'ManagementBrowser2026!';
let organizationId = '';
let email = '';
test.beforeEach(async ({ page }) => {
  test.setTimeout(90000);
  const organization = await db.organization.create({ data: { name: 'E2E Management Workspace' } });
  organizationId = organization.id;
  email = `management-${organizationId}@buildtrack.test`;
  await db.user.create({
    data: {
      organizationId,
      email,
      name: 'Management Administrator',
      role: 'ADMINISTRATOR',
      passwordHash: await bcrypt.hash(password, 12),
    },
  });
  await page.goto('/login');
  await page.getByLabel('Work email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/workspace/);
});
test.afterEach(async () => {
  if (!organizationId) return;
  const storedVersions = await db.documentVersion.findMany({ where: { document: { organizationId } }, select: { storagePath: true } });
  await db.shift.deleteMany({ where: { worker: { organizationId } } });
  await db.attendance.deleteMany({ where: { worker: { organizationId } } });
  await db.workerProjectAssignment.deleteMany({ where: { worker: { organizationId } } });
  await db.workerProfile.deleteMany({ where: { organizationId } });
  await db.notification.deleteMany({ where: { organizationId } });
  await db.documentVersion.deleteMany({ where: { document: { organizationId } } });
  await db.document.deleteMany({ where: { organizationId } });
  for (const version of storedVersions) await unlink(version.storagePath).catch(() => undefined);
  await db.stockMovement.deleteMany({ where: { material: { organizationId } } });
  await db.expense.deleteMany({ where: { organizationId } });
  await db.budgetAllocation.deleteMany({ where: { project: { organizationId } } });
  await db.invoice.deleteMany({ where: { organizationId } });
  await db.goodsReceipt.deleteMany({ where: { organizationId } });
  await db.purchaseOrder.deleteMany({ where: { organizationId } });
  await db.procurementRequest.deleteMany({ where: { project: { organizationId } } });
  await db.vendor.deleteMany({ where: { organizationId } });
  await db.maintenanceRecord.deleteMany({ where: { equipment: { organizationId } } });
  await db.equipmentAllocation.deleteMany({ where: { equipment: { organizationId } } });
  await db.equipment.deleteMany({ where: { organizationId } });
  await db.materialRequest.deleteMany({ where: { material: { organizationId } } });
  await db.material.deleteMany({ where: { organizationId } });
  await db.project.deleteMany({ where: { organizationId } });
  await db.auditLog.deleteMany({ where: { organizationId } });
  await db.user.deleteMany({ where: { organizationId } });
  await db.organization.delete({ where: { id: organizationId } });
  organizationId = '';
});
test.afterAll(() => db.$disconnect());
test('administrator creates, edits, resets and deactivates a member', async ({ page }) => {
  await page.getByRole('link', { name: 'Team directory' }).click();
  await page.getByRole('button', { name: 'Add team member' }).click();
  await page.getByLabel('Full name', { exact: true }).fill('New Site Engineer');
  await page
    .getByLabel('Email address', { exact: true })
    .fill(`engineer-${organizationId}@buildtrack.test`);
  await page
    .getByRole('region', { name: 'Add team member' })
    .getByLabel('Role', { exact: true })
    .selectOption('SITE_ENGINEER');
  await page.getByLabel('Initial password').fill(password);
  await page.getByRole('button', { name: 'Save member' }).click();
  await expect(page.getByRole('status')).toHaveText('Team member created.');
  await page.reload();
  const row = page.getByRole('row').filter({ hasText: 'New Site Engineer' });
  await expect(row).toContainText('Site Engineer');
  await page
    .getByRole('button', { name: 'Reset password for New Site Engineer', exact: true })
    .click();
  await expect(page.getByRole('status')).toContainText('Password reset requested');
  await page.getByRole('button', { name: 'Edit New Site Engineer', exact: true }).click();
  await page
    .getByRole('region', { name: 'Edit team member' })
    .getByLabel('Role', { exact: true })
    .selectOption('CONTRACTOR');
  await page.getByLabel('Account access').selectOption({ label: 'Inactive' });
  await page.getByRole('button', { name: 'Save member' }).click();
  await expect(row).toContainText('Inactive');
  await expect(row).toContainText('Contractor');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    animations: 'disabled',
    path: 'tmp/ui/team-management-desktop.png',
    fullPage: true,
  });
});
test('project creation, persistence, editing, filtering and status lifecycle', async ({ page }) => {
  await page.getByRole('link', { name: 'Projects', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'No projects found' })).toBeVisible();
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  await page.getByLabel('Project code').fill('BT-BROWSER-001');
  await page.getByLabel('Project name').fill('Browser Construction Site');
  await page.getByLabel('Address', { exact: false }).fill('42 Construction Road');
  await page.getByLabel('City', { exact: false }).fill('Pune');
  await page.getByLabel('State', { exact: false }).fill('Maharashtra');
  await page.getByLabel('Start date').fill('2026-09-24');
  await page.getByLabel('Expected end date').fill('2027-07-01');
  await page.getByLabel('Budget (').fill('1500000.25');
  await page.getByLabel('Estimated cost').fill('1200000');
  await page.getByRole('button', { name: 'Save project' }).click();
  await expect(page).toHaveURL(/projects\/[a-f0-9-]+$/);
  await expect(page.getByRole('heading', { name: 'Project overview' })).toBeVisible();
  await page.reload();
  await expect(page.getByText('₹1,500,000.25', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Edit project', exact: true }).click();
  await page.getByLabel('Project name').fill('Updated Construction Site');
  await page.getByRole('button', { name: 'Save project' }).click();
  await expect(page.getByRole('status')).toHaveText('Project updated.');
  await page.getByLabel('Search workspace').fill('Updated Construction');
  await expect(page.getByRole('option', { name: /Updated Construction Site/ })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByLabel('Update status', { exact: true }).selectOption('ACTIVE');
  await page.getByRole('button', { name: 'Update status', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Project status updated.');
  await page.getByRole('link', { name: 'Timeline & milestones' }).click();
  await page.getByRole('button', { name: 'Add schedule item' }).click();
  await page.getByLabel('Name', { exact: true }).fill('Foundation milestone');
  await page.getByLabel('Start date').fill('2026-09-24');
  await page.getByLabel('Planned completion').fill('2026-10-15');
  await page.getByLabel('Status', { exact: true }).selectOption('IN_PROGRESS');
  await page.getByLabel('Progress %').fill('35');
  await page.getByRole('button', { name: 'Save item' }).click();
  await expect(page.getByRole('status')).toHaveText('Schedule item created.');
  await expect(page.getByRole('heading', { name: 'Foundation milestone' })).toBeVisible();
  await page.reload();
  await expect(page.getByText('35% · weight 1 · Unassigned')).toBeVisible();
  await page.getByRole('link', { name: 'Project overview', exact: false }).click();
  await expect(page.getByText('35%', { exact: true }).first()).toBeVisible();
  await page.getByRole('link', { name: 'Site operations' }).click();
  await page.getByRole('button', { name: 'Daily report' }).click();
  await page.getByLabel('Date', { exact: true }).fill('2026-09-28');
  await page.getByLabel('Weather').fill('Clear');
  await page.getByLabel('Workers present').fill('18');
  await page.getByLabel('Reported progress %').fill('35');
  await page.getByLabel('Work completed').fill('Foundation reinforcement completed');
  await page.getByRole('button', { name: 'Save report' }).click();
  await expect(page.getByRole('status')).toHaveText('Daily report saved.');
  await expect(
    page.getByRole('heading', { name: 'Foundation reinforcement completed' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Project overview', exact: false }).click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    animations: 'disabled',
    path: 'tmp/ui/project-details-desktop.png',
    fullPage: true,
  });
  await page.getByRole('link', { name: 'All projects', exact: false }).click();
  await page.getByLabel('Find a project').fill('Updated Construction');
  await page.getByLabel('Status', { exact: true }).selectOption('ACTIVE');
  await page.getByRole('button', { name: 'Apply filters' }).click();
  await expect(page.getByRole('heading', { name: 'Updated Construction Site' })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    animations: 'disabled',
    path: 'tmp/ui/projects-mobile.png',
    fullPage: true,
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('equipment persists and maintenance changes availability', async ({ page }) => {
  await page.getByRole('link', { name: 'Equipment', exact: true }).click();
  await page.getByRole('button', { name: 'Add equipment' }).click();
  await page.getByLabel('Equipment code').fill('CR-E2E-01');
  await page.getByLabel('Equipment name').fill('E2E Mobile Crane');
  await page.getByLabel('Type').fill('Crane');
  await page.getByLabel('Location').fill('Central yard');
  await page.getByLabel('Hourly rate').fill('3500');
  await page.getByLabel('Commissioned date').fill('2024-01-15');
  await page.getByLabel('Service interval (days)').fill('120');
  await page.getByRole('button', { name: 'Save equipment' }).click();
  await expect(page.getByRole('status')).toHaveText('Equipment added.');
  const row = page.getByRole('row').filter({ hasText: 'E2E Mobile Crane' });
  await expect(row).toContainText('Available');
  await row.getByRole('button', { name: 'Maintain' }).click();
  await page.getByLabel('Scheduled date').fill('2026-10-15T09:00');
  await page.getByLabel('Downtime hours').fill('4.5');
  await page.getByLabel('Failure-related maintenance').check();
  await page.getByRole('button', { name: 'Schedule maintenance' }).click();
  await expect(page.getByRole('status')).toHaveText('Maintenance scheduled.');
  await row.getByRole('button', { name: 'Start' }).click();
  await expect(row).toContainText('Maintenance');
  await page.reload();
  await expect(row).toContainText('Maintenance');
  await page.screenshot({
    animations: 'disabled',
    path: 'tmp/ui/equipment-desktop.png',
    fullPage: true,
  });
});
test('inventory request moves from submission through fulfilment', async ({ page }) => {
  const admin = await db.user.findUniqueOrThrow({ where: { email } });
  const project = await db.project.create({
    data: {
      organizationId,
      code: 'BT-INVENTORY-E2E',
      name: 'Inventory E2E',
      category: 'Residential',
      address: 'Material site',
      city: 'Pune',
      state: 'Maharashtra',
      startDate: new Date('2026-09-01'),
      endDate: new Date('2027-12-31'),
      budget: '1000000',
      estimatedCost: '900000',
      members: { create: { userId: admin.id } },
    },
  });
  await page.getByRole('link', { name: 'Inventory', exact: true }).click();
  await page.getByRole('button', { name: 'Add material' }).click();
  await page.getByLabel('SKU').fill('CEM-E2E-01');
  await page.getByLabel('Material name').fill('E2E Cement');
  await page.getByLabel('Opening stock').fill('50');
  await page.getByLabel('Minimum level').fill('20');
  await page.getByLabel('Critical level').fill('5');
  await page.getByLabel('Unit cost').fill('400');
  await page.getByRole('button', { name: 'Save material' }).click();
  await expect(page.getByRole('status')).toHaveText('Material created.');
  await page.getByRole('button', { name: 'New request' }).click();
  await page.getByLabel('Project').selectOption(project.id);
  const material = await db.material.findFirstOrThrow({
    where: { organizationId, sku: 'CEM-E2E-01' },
  });
  await page.getByLabel('Material').selectOption(material.id);
  await page.getByLabel('Quantity').fill('10');
  await page.getByLabel('Required date').fill('2026-10-15');
  await page.getByLabel('Purpose').fill('Foundation concrete');
  await page.getByRole('button', { name: 'Submit request' }).click();
  await expect(page.getByRole('status')).toHaveText('Material request created.');
  const row = page.getByRole('row').filter({ hasText: 'Inventory E2E' });
  await row.getByRole('button', { name: 'Approve' }).click();
  await row.getByRole('button', { name: 'Allocate' }).click();
  await row.getByRole('button', { name: 'Fulfil' }).click();
  await expect(row).toContainText('Fulfilled');
  await expect(page.getByRole('row').filter({ hasText: 'E2E Cement' }).first()).toContainText(
    '40 bags',
  );
});

test('workforce assignment, attendance, shift and payroll estimate persist', async ({ page }) => {
  const admin = await db.user.findUniqueOrThrow({ where: { email } });
  const project = await db.project.create({
    data: {
      organizationId,
      code: 'BT-WORKFORCE-E2E',
      name: 'Workforce E2E',
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
  await page.getByRole('link', { name: 'Workforce', exact: true }).click();
  await page.getByRole('button', { name: 'Add worker' }).click();
  await page.getByLabel('Employee ID').fill('EMP-E2E-01');
  await page.getByLabel('Worker name').fill('E2E Site Mason');
  await page.getByLabel('Category').fill('Mason');
  await page.getByLabel('Phone').fill('+91 90000 00001');
  await page.getByLabel('Hourly rate').fill('250');
  await page.getByRole('button', { name: 'Save worker' }).click();
  await expect(page.getByRole('status')).toHaveText('Worker created.');
  const workerRow = page.getByRole('row').filter({ hasText: 'E2E Site Mason' }).first();
  await workerRow.getByRole('button', { name: 'Assign' }).click();
  await page.getByLabel('Project').selectOption(project.id);
  await page.getByLabel('Site role').fill('Mason');
  await page.getByLabel('Start date').fill('2026-09-01');
  await page.getByRole('button', { name: 'Assign worker' }).click();
  await expect(page.getByRole('status')).toHaveText('Worker assigned.');
  const worker = await db.workerProfile.findFirstOrThrow({ where: { organizationId, employeeCode: 'EMP-E2E-01' } });
  await page.getByRole('button', { name: 'Record attendance' }).click();
  await page.getByLabel('Worker').selectOption(worker.id);
  await page.getByLabel('Project').selectOption(project.id);
  await page.getByLabel('Work date').fill('2026-09-28');
  await page.getByLabel('Hours', { exact: true }).fill('8');
  await page.getByRole('button', { name: 'Save attendance' }).click();
  await expect(page.getByRole('status')).toHaveText('Attendance recorded.');
  await expect(page.getByRole('row').filter({ hasText: 'E2E Site Mason' }).last()).toContainText('2,000.00');
  await page.getByRole('button', { name: 'Schedule shift' }).click();
  await page.getByLabel('Worker').selectOption(worker.id);
  await page.getByLabel('Project').selectOption(project.id);
  const shiftDate = new Date();
  shiftDate.setDate(shiftDate.getDate() + 1);
  const shiftDay = [
    shiftDate.getFullYear(),
    String(shiftDate.getMonth() + 1).padStart(2, '0'),
    String(shiftDate.getDate()).padStart(2, '0'),
  ].join('-');
  await page.getByLabel('Shift starts').fill(`${shiftDay}T09:00`);
  await page.getByLabel('Shift ends').fill(`${shiftDay}T17:00`);
  await page.getByLabel('Location').fill('Tower A');
  await page.locator('form').getByRole('button', { name: 'Schedule shift', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Shift scheduled.');
  await expect(page.getByRole('row').filter({ hasText: 'Tower A' })).toContainText('E2E Site Mason');
  await page.screenshot({ animations: 'disabled', path: 'tmp/ui/workforce-desktop.png', fullPage: true });
});

test('procurement request, approval, purchase order, receipt and invoice persist', async ({ page }) => {
  const admin = await db.user.findUniqueOrThrow({ where: { email } });
  const project = await db.project.create({ data: { organizationId, code: 'BT-PROC-E2E', name: 'Procurement E2E', category: 'Commercial', address: 'Procurement site', city: 'Pune', state: 'Maharashtra', startDate: new Date('2026-09-01'), endDate: new Date('2027-12-31'), budget: '1000000', estimatedCost: '900000', members: { create: { userId: admin.id } } } });
  const material = await db.material.create({ data: { organizationId, sku: 'PROC-E2E-01', name: 'E2E Ready Mix', category: 'Concrete', unit: 'm³', currentStock: '10', minimumLevel: '5', criticalLevel: '2', unitCost: '5000' } });
  await page.getByRole('link', { name: 'Procurement', exact: true }).click();
  await page.getByRole('button', { name: 'Add vendor' }).click();
  await page.getByLabel('Vendor code').fill('VEN-E2E-01');
  await page.getByLabel('Vendor name').fill('E2E Concrete Supply');
  await page.getByLabel('Contact name').fill('Vendor Contact');
  await page.getByRole('button', { name: 'Save vendor' }).click();
  await expect(page.getByRole('status')).toHaveText('Vendor created.');
  await page.getByRole('button', { name: 'New request' }).click();
  await page.getByLabel('Project').selectOption(project.id);
  await page.getByLabel('Material').selectOption(material.id);
  await page.getByLabel('Quantity').fill('12');
  await page.getByLabel('Required date').fill('2026-10-15');
  await page.getByLabel('Justification').fill('Concrete pour for Tower A');
  await page.getByRole('button', { name: 'Submit request' }).click();
  await expect(page.getByRole('status')).toHaveText('Procurement request created.');
  const requestRow = page.getByRole('row').filter({ hasText: 'Procurement E2E' }).first();
  await requestRow.getByRole('button', { name: 'Approve' }).click();
  await expect(requestRow).toContainText('Approved');
  const procurement = await db.procurementRequest.findFirstOrThrow({ where: { projectId: project.id } });
  const vendor = await db.vendor.findFirstOrThrow({ where: { organizationId, code: 'VEN-E2E-01' } });
  await page.getByRole('button', { name: 'Issue purchase order' }).click();
  await page.getByLabel('Approved request').selectOption(procurement.id);
  await page.getByLabel('Vendor').selectOption(vendor.id);
  await page.getByLabel('PO number').fill('PO-E2E-001');
  await page.getByLabel('Unit price').fill('5000');
  await page.getByLabel('Tax rate %').fill('18');
  await page.getByLabel('Expected date').fill('2026-10-15');
  await page.getByRole('button', { name: 'Issue order' }).click();
  await expect(page.getByRole('status')).toHaveText('Purchase order issued.');
  const orderRow = page.getByRole('row').filter({ hasText: 'PO-E2E-001' }).first();
  await orderRow.getByRole('button', { name: 'Receive' }).click();
  await page.getByLabel('Receipt number').fill('GRN-E2E-001');
  await page.getByLabel('Received quantity').fill('12');
  await page.getByLabel('Received at').fill('2026-09-28T13:30');
  await page.getByRole('button', { name: 'Record receipt' }).click();
  await expect(page.getByRole('status')).toHaveText('Goods receipt recorded.');
  await expect(orderRow).toContainText('Received');
  expect((await db.material.findUniqueOrThrow({ where: { id: material.id } })).currentStock.toString()).toBe('22');
  await orderRow.getByRole('button', { name: 'Invoice' }).click();
  await page.getByLabel('Invoice number').fill('INV-E2E-001');
  await page.getByLabel('Invoice date').fill('2026-09-28');
  await page.getByLabel('Due date').fill('2026-10-28');
  await page.getByRole('button', { name: 'Save invoice' }).click();
  await expect(page.getByRole('status')).toHaveText('Invoice recorded.');
  const invoiceRow = page.getByRole('row').filter({ hasText: 'INV-E2E-001' });
  await invoiceRow.getByRole('button', { name: 'Verify' }).click();
  await expect(invoiceRow).toContainText('Verified');
  await page.screenshot({ animations: 'disabled', path: 'tmp/ui/procurement-desktop.png', fullPage: true });
});

test('budget allocation and approved expense update the financial forecast', async ({ page }) => {
  const admin = await db.user.findUniqueOrThrow({ where: { email } });
  const project = await db.project.create({ data: { organizationId, code: 'BT-FIN-E2E', name: 'Finance E2E', category: 'Commercial', address: 'Finance site', city: 'Pune', state: 'Maharashtra', startDate: new Date('2026-09-01'), endDate: new Date('2027-12-31'), budget: '1000000', estimatedCost: '900000', members: { create: { userId: admin.id } } } });
  await page.getByRole('link', { name: 'Budgets & expenses', exact: true }).click();
  await page.getByRole('button', { name: 'Allocate budget' }).click();
  await page.getByLabel('Project').selectOption(project.id);
  await page.getByLabel('Category').fill('Materials');
  await page.getByLabel('Allocated amount').fill('600000');
  await page.getByRole('button', { name: 'Save allocation' }).click();
  await expect(page.getByRole('status')).toHaveText('Budget allocation created.');
  await expect(page.getByText('Materials · ₹600,000.00')).toBeVisible();
  await page.getByRole('button', { name: 'Submit expense' }).click();
  await page.getByLabel('Project').selectOption(project.id);
  await page.getByLabel('Category').fill('Site services');
  await page.getByLabel('Description').fill('Temporary power connection');
  await page.getByLabel('Amount').fill('100000');
  await page.getByLabel('Expense date').fill('2026-09-28');
  await page.getByLabel('Source reference').fill('EXP-E2E-001');
  await page.getByRole('button', { name: 'Submit expense', exact: true }).last().click();
  await expect(page.getByRole('status')).toHaveText('Expense submitted.');
  const expenseRow = page.getByRole('row').filter({ hasText: 'Temporary power connection' });
  await expenseRow.getByRole('button', { name: 'Approve' }).click();
  await expect(expenseRow).toContainText('Approved');
  await expect(page.getByRole('article').filter({ hasText: 'Finance E2E' })).toContainText('₹900,000.00');
  await expenseRow.getByRole('button', { name: 'Mark paid' }).click();
  await expect(expenseRow).toContainText('Paid');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ animations: 'disabled', path: 'tmp/ui/finance-desktop.png', fullPage: true });
});

test('document upload, authorized downloads, reports and recipient notification work', async ({ page }) => {
  const admin = await db.user.findUniqueOrThrow({ where: { email } });
  const managerEmail = `records-manager-${organizationId}@buildtrack.test`;
  const manager = await db.user.create({ data: { organizationId, email: managerEmail, name: 'Records Manager', role: 'PROJECT_MANAGER', passwordHash: await bcrypt.hash(password, 12) } });
  const project = await db.project.create({ data: { organizationId, code: 'BT-DOC-E2E', name: 'Records E2E', category: 'Commercial', address: 'Records site', city: 'Pune', state: 'Maharashtra', startDate: new Date('2026-09-01'), endDate: new Date('2027-12-31'), budget: '1000000', estimatedCost: '900000', members: { create: [{ userId: admin.id }, { userId: manager.id }] } } });
  await page.getByRole('link', { name: 'Documents & reports', exact: true }).click();
  await page.getByRole('button', { name: 'Upload document' }).click();
  await page.locator('#doc-project').selectOption(project.id);
  await page.getByLabel('Document title').fill('Tower A approved drawing');
  await page.getByLabel('Category').selectOption('Drawing');
  await page.getByLabel('File').setInputFiles({
    name: 'test-document.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n'),
  });
  await page.getByRole('button', { name: 'Upload file' }).click();
  await expect(page.getByRole('status')).toHaveText('Document uploaded.');
  const documentRow = page.getByRole('row').filter({ hasText: 'Tower A approved drawing' });
  await expect(documentRow).toContainText('v1');
  const fileDownload = page.waitForEvent('download');
  await documentRow.getByRole('button', { name: 'Download' }).click();
  expect((await fileDownload).suggestedFilename()).toBe('test-document.pdf');
  await page.locator('#report-project').selectOption(project.id);
  const pdfDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download project PDF' }).click();
  expect((await pdfDownload).suggestedFilename()).toBe('BT-DOC-E2E-summary.pdf');
  const xlsxDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download expenses XLSX' }).click();
  expect((await xlsxDownload).suggestedFilename()).toBe('BT-DOC-E2E-expenses.xlsx');
  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.getByLabel('Work email').fill(managerEmail);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.getByRole('link', { name: 'Notifications', exact: true }).click();
  await expect(page.getByText('Document updated: Tower A approved drawing')).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ animations: 'disabled', path: 'tmp/ui/notifications-desktop.png', fullPage: true });
});

test('analytics reconciles project risk and labels demo providers', async ({ page }) => {
  const admin = await db.user.findUniqueOrThrow({ where: { email } });
  const project = await db.project.create({ data: { organizationId, code: 'BT-AN-E2E', name: 'Analytics E2E', category: 'Commercial', address: 'Analytics site', city: 'Pune', state: 'Maharashtra', startDate: new Date('2026-09-01'), endDate: new Date('2027-12-31'), budget: '1000000', estimatedCost: '900000', members: { create: { userId: admin.id } } } });
  await db.workItem.create({ data: { projectId: project.id, kind: 'MILESTONE', name: 'Structural milestone', startDate: new Date('2026-09-01'), plannedDate: new Date('2026-09-20'), status: 'IN_PROGRESS', progress: 40 } });
  await db.siteReport.create({ data: { projectId: project.id, authorId: admin.id, reportDate: new Date('2026-09-28'), weather: 'Clear', workersPresent: 25, workCompleted: 'Structural columns', reportedProgress: 40 } });
  await page.getByRole('link', { name: 'Analytics & insights', exact: true }).click();
  const card = page.getByRole('button').filter({ hasText: 'Analytics E2E' });
  await expect(card).toContainText('40%');
  await expect(card).toContainText('Overdue');
  await card.click();
  await expect(page.getByText('Demonstration weather — not live')).toBeVisible();
  await expect(page.getByText('Camera feeds are not configured')).toBeVisible();
  await expect(page.getByText('40% reported progress')).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ animations: 'disabled', path: 'tmp/ui/analytics-desktop.png', fullPage: true });
  await page.getByRole('link', { name: 'ML insights', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Schedule-delay probability' })).toBeVisible();
  await expect(page.getByText('Organization-scoped logistic regression')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Material-demand forecast' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Cost-at-completion forecast' })).toBeVisible();
  await expect(page.getByText('Organization-scoped ridge regression')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Predictive equipment maintenance' })).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ animations: 'disabled', path: 'tmp/ui/ml-insights-desktop.png', fullPage: true });
});

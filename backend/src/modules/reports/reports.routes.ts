import { Router } from 'express';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { z } from 'zod';
import { db } from '../../shared/db';
import { authenticate, requirePermission } from '../auth/auth.middleware';
import { accessProject } from '../projects/project-access';
import { rolePermissions } from '../../shared/permissions';

export const reportsRouter = Router();
reportsRouter.use(authenticate, requirePermission('REPORT_VIEW'));
reportsRouter.get('/project-summary.pdf', async (req, res) => {
  const projectId = z.uuid().parse(req.query.projectId), actor = req.identity!;
  const project = await db.$transaction((tx) => accessProject(tx, projectId, actor, 'REPORT_VIEW'));
  const [items, reports, delays, inspections, expenses] = await Promise.all([
    db.workItem.findMany({ where: { projectId }, orderBy: { plannedDate: 'asc' } }),
    db.siteReport.findMany({ where: { projectId }, orderBy: { reportDate: 'desc' }, take: 10 }),
    db.siteDelay.findMany({ where: { projectId, status: { not: 'RESOLVED' } } }),
    db.inspection.findMany({ where: { projectId, resolved: false } }),
    db.expense.findMany({ where: { projectId, status: { in: ['APPROVED', 'PAID'] } } }),
  ]);
  res.type('application/pdf'); res.setHeader('Content-Disposition', `attachment; filename="${project.code}-summary.pdf"`);
  const pdf = new PDFDocument({ margin: 48, size: 'A4' }); pdf.pipe(res);
  pdf.fillColor('#0b1f33').fontSize(24).text('BuildTrack Project Summary');
  pdf.moveDown().fontSize(16).text(`${project.code} · ${project.name}`);
  pdf.fontSize(10).fillColor('#53657a').text(`${project.city}, ${project.state} | ${project.status} | ${project.startDate.toISOString().slice(0, 10)} to ${project.endDate.toISOString().slice(0, 10)}`);
  pdf.moveDown().fillColor('#0b1f33').fontSize(13).text('Schedule'); pdf.fontSize(10).text(`${items.filter((item) => item.status === 'COMPLETED').length} of ${items.length} items complete`);
  for (const item of items.slice(0, 12)) pdf.text(`• ${item.name}: ${item.progress}% (${item.status.replaceAll('_', ' ')})`);
  pdf.moveDown().fontSize(13).text('Site controls'); pdf.fontSize(10).text(`${reports.length} recent daily reports · ${delays.length} open delays · ${inspections.length} unresolved inspections`);
  const actual = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  if (rolePermissions[actor.role].includes('BUDGET_VIEW')) pdf.moveDown().fontSize(13).text('Finance').fontSize(10).text(`Budget: ${project.budget.toString()} ${actor.organization.currency} · Approved actual: ${actual.toFixed(2)} ${actor.organization.currency}`);
  pdf.moveDown(2).fontSize(8).fillColor('#7b8794').text(`Generated ${new Date().toISOString()} from BuildTrack database records.`);
  pdf.end();
});
reportsRouter.get('/expenses.xlsx', requirePermission('REPORT_EXPORT'), async (req, res) => {
  const projectId = z.uuid().parse(req.query.projectId), actor = req.identity!;
  const project = await db.$transaction((tx) => accessProject(tx, projectId, actor, 'REPORT_EXPORT'));
  const expenses = await db.expense.findMany({ where: { projectId }, include: { vendor: true, createdBy: true }, orderBy: { expenseDate: 'asc' } });
  const workbook = new ExcelJS.Workbook(); workbook.creator = 'BuildTrack'; workbook.created = new Date();
  const sheet = workbook.addWorksheet('Expenses');
  sheet.columns = [
    { header: 'Date', key: 'date', width: 14 }, { header: 'Category', key: 'category', width: 22 }, { header: 'Description', key: 'description', width: 36 },
    { header: 'Vendor / submitter', key: 'source', width: 26 }, { header: 'Reference', key: 'reference', width: 20 }, { header: 'Status', key: 'status', width: 14 },
    { header: `Amount (${actor.organization.currency})`, key: 'amount', width: 20 },
  ];
  for (const expense of expenses) sheet.addRow({ date: expense.expenseDate.toISOString().slice(0, 10), category: expense.category, description: expense.description, source: expense.vendor?.name || expense.createdBy?.name || '', reference: expense.sourceRef || '', status: expense.status, amount: Number(expense.amount) });
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }; sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B1F33' } }; sheet.getColumn('amount').numFmt = '#,##0.00'; sheet.views = [{ state: 'frozen', ySplit: 1 }];
  const bytes = await workbook.xlsx.writeBuffer();
  res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); res.setHeader('Content-Disposition', `attachment; filename="${project.code}-expenses.xlsx"`); return res.send(Buffer.from(bytes));
});

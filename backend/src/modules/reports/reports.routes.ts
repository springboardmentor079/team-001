import { Router } from 'express';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { db } from '../../shared/db';
import { authenticate, requirePermission } from '../auth/auth.middleware';
import { accessProject, scheduleSummary } from '../projects/project-access';
import { rolePermissions } from '../../shared/permissions';

type Pdf = InstanceType<typeof PDFDocument>;
const green = '#245C45';
const deepGreen = '#173F30';
const text = '#202B25';
const muted = '#68756D';
const border = '#E1E8E2';
const amber = '#D99128';
const red = '#C84C4C';
const blue = '#477BA8';
const chartColors = [green, blue, amber, red, '#6F8F7A', '#8B6FA8'];

const date = (value: Date) => value.toISOString().slice(0, 10);
const label = (value: string) =>
  value
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
const money = (value: number, currency: string) =>
  `${currency} ${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value)}`;

function roundedBox(
  pdf: Pdf,
  x: number,
  y: number,
  width: number,
  height: number,
  fill = '#FFFFFF',
) {
  pdf.roundedRect(x, y, width, height, 7).fillAndStroke(fill, border);
}

function sectionHeading(pdf: Pdf, title: string, subtitle: string, y: number) {
  pdf.fillColor(green).font('Helvetica-Bold').fontSize(8).text('BUILDTRACK ANALYTICS', 44, y);
  pdf
    .fillColor(text)
    .fontSize(16)
    .text(title, 44, y + 14);
  pdf
    .fillColor(muted)
    .font('Helvetica')
    .fontSize(8.5)
    .text(subtitle, 44, y + 36, { width: 500 });
}

function metricCard(
  pdf: Pdf,
  x: number,
  y: number,
  width: number,
  title: string,
  value: string,
  note: string,
) {
  roundedBox(pdf, x, y, width, 72);
  pdf
    .fillColor(muted)
    .font('Helvetica-Bold')
    .fontSize(6.5)
    .text(title, x + 11, y + 11, {
      characterSpacing: 0.7,
    });
  pdf
    .fillColor(text)
    .fontSize(17)
    .text(value, x + 11, y + 27, { width: width - 22 });
  pdf
    .fillColor(muted)
    .font('Helvetica')
    .fontSize(6.5)
    .text(note, x + 11, y + 53, {
      width: width - 22,
    });
  pdf.rect(x + width - 3, y + 1, 2, 70).fill(green);
}

function lineChart(
  pdf: Pdf,
  points: { date: Date; progress: number }[],
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const plotLeft = x + 34;
  const plotTop = y + 12;
  const plotWidth = width - 48;
  const plotHeight = height - 38;
  pdf.save();
  for (let tick = 0; tick <= 4; tick += 1) {
    const value = tick * 25;
    const tickY = plotTop + plotHeight - (value / 100) * plotHeight;
    pdf
      .strokeColor('#E8EEE9')
      .lineWidth(0.6)
      .moveTo(plotLeft, tickY)
      .lineTo(plotLeft + plotWidth, tickY)
      .stroke();
    pdf
      .fillColor(muted)
      .fontSize(6)
      .text(`${value}%`, x, tickY - 3, { width: 28, align: 'right' });
  }
  if (!points.length) {
    pdf
      .fillColor(muted)
      .fontSize(9)
      .text(
        'No dated site-report progress observations recorded.',
        plotLeft,
        plotTop + plotHeight / 2 - 5,
        { width: plotWidth, align: 'center' },
      );
    pdf.restore();
    return;
  }
  const coordinates = points.map((point, index) => ({
    x:
      points.length === 1
        ? plotLeft + plotWidth / 2
        : plotLeft + (index / (points.length - 1)) * plotWidth,
    y: plotTop + plotHeight - (Math.max(0, Math.min(100, point.progress)) / 100) * plotHeight,
  }));
  pdf.strokeColor(green).lineWidth(2);
  coordinates.forEach((point, index) => {
    if (index === 0) pdf.moveTo(point.x, point.y);
    else pdf.lineTo(point.x, point.y);
  });
  if (coordinates.length > 1) pdf.stroke();
  for (const point of coordinates)
    pdf.circle(point.x, point.y, 2.8).fillAndStroke(green, '#FFFFFF');
  pdf
    .fillColor(muted)
    .fontSize(6.5)
    .text(date(points[0]!.date), plotLeft, plotTop + plotHeight + 8);
  if (points.length > 1)
    pdf.text(date(points.at(-1)!.date), plotLeft + plotWidth - 70, plotTop + plotHeight + 8, {
      width: 70,
      align: 'right',
    });
  pdf.restore();
}

function horizontalBars(
  pdf: Pdf,
  rows: { name: string; progress: number; status: string }[],
  x: number,
  y: number,
  width: number,
) {
  if (!rows.length) {
    pdf
      .fillColor(muted)
      .fontSize(9)
      .text('No milestones or work items recorded.', x, y + 24, { width, align: 'center' });
    return;
  }
  const labelWidth = 150;
  const barWidth = width - labelWidth - 52;
  rows.slice(0, 8).forEach((row, index) => {
    const rowY = y + index * 24;
    pdf
      .fillColor(text)
      .font('Helvetica-Bold')
      .fontSize(7.2)
      .text(row.name, x, rowY + 2, { width: labelWidth - 8, ellipsis: true });
    pdf
      .fillColor('#EDF1EE')
      .roundedRect(x + labelWidth, rowY + 2, barWidth, 8, 4)
      .fill();
    const color = row.status === 'DELAYED' ? amber : row.status === 'COMPLETED' ? green : blue;
    if (row.progress > 0)
      pdf
        .fillColor(color)
        .roundedRect(
          x + labelWidth,
          rowY + 2,
          Math.max(3, (Math.min(100, row.progress) / 100) * barWidth),
          8,
          4,
        )
        .fill();
    pdf
      .fillColor(muted)
      .font('Helvetica')
      .fontSize(6.5)
      .text(`${row.progress}%`, x + labelWidth + barWidth + 7, rowY + 2, {
        width: 38,
        align: 'right',
      });
    pdf
      .fillColor(muted)
      .fontSize(5.7)
      .text(label(row.status), x + labelWidth, rowY + 13, { width: barWidth });
  });
}

function doughnut(
  pdf: Pdf,
  rows: { label: string; value: number }[],
  centerX: number,
  centerY: number,
  radius: number,
) {
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  if (!total) {
    pdf
      .fillColor(muted)
      .fontSize(9)
      .text('No work-item status records.', centerX - 75, centerY - 5, {
        width: 150,
        align: 'center',
      });
    return;
  }
  let angle = -Math.PI / 2;
  rows.forEach((row, index) => {
    const end = angle + (row.value / total) * Math.PI * 2;
    pdf
      .save()
      .fillColor(chartColors[index % chartColors.length]!)
      .moveTo(centerX, centerY);
    const steps = Math.max(3, Math.ceil(((end - angle) / (Math.PI * 2)) * 80));
    for (let step = 0; step <= steps; step += 1) {
      const current = angle + ((end - angle) * step) / steps;
      pdf.lineTo(centerX + Math.cos(current) * radius, centerY + Math.sin(current) * radius);
    }
    pdf.lineTo(centerX, centerY).fill().restore();
    angle = end;
  });
  pdf.circle(centerX, centerY, radius * 0.56).fill('#FFFFFF');
  pdf
    .fillColor(text)
    .font('Helvetica-Bold')
    .fontSize(17)
    .text(String(total), centerX - 25, centerY - 10, { width: 50, align: 'center' });
  pdf
    .fillColor(muted)
    .font('Helvetica')
    .fontSize(5.5)
    .text('TOTAL ITEMS', centerX - 30, centerY + 10, { width: 60, align: 'center' });
  rows.forEach((row, index) => {
    const legendY = centerY - radius + index * 20;
    pdf
      .fillColor(chartColors[index % chartColors.length]!)
      .rect(centerX + radius + 28, legendY + 2, 7, 7)
      .fill();
    pdf
      .fillColor(text)
      .font('Helvetica')
      .fontSize(7)
      .text(label(row.label), centerX + radius + 42, legendY, { width: 105 });
    pdf
      .font('Helvetica-Bold')
      .text(
        `${row.value} | ${((row.value / total) * 100).toFixed(0)}%`,
        centerX + radius + 147,
        legendY,
        { width: 55, align: 'right' },
      );
  });
}

function footerPages(pdf: Pdf, generatedAt: Date) {
  const range = pdf.bufferedPageRange();
  for (let index = range.start; index < range.start + range.count; index += 1) {
    pdf.switchToPage(index);
    const originalBottomMargin = pdf.page.margins.bottom;
    pdf.page.margins.bottom = 0;
    pdf.strokeColor(border).lineWidth(0.6).moveTo(44, 802).lineTo(551, 802).stroke();
    pdf
      .fillColor(muted)
      .font('Helvetica')
      .fontSize(6.5)
      .text(
        `Generated ${generatedAt.toISOString()} from authorised BuildTrack database records.`,
        44,
        810,
        { width: 390, lineBreak: false },
      );
    pdf.text(`Page ${index + 1} of ${range.count}`, 455, 810, {
      width: 96,
      align: 'right',
      lineBreak: false,
    });
    pdf.page.margins.bottom = originalBottomMargin;
  }
}

export const reportsRouter = Router();
reportsRouter.use(authenticate, requirePermission('REPORT_VIEW'));

reportsRouter.get('/project-summary.pdf', async (req, res) => {
  const projectId = z.uuid().parse(req.query.projectId);
  const actor = req.identity!;
  const project = await db.$transaction((tx) => accessProject(tx, projectId, actor, 'REPORT_VIEW'));
  const [items, reports, delays, inspections, expenses, procurement] = await Promise.all([
    db.workItem.findMany({ where: { projectId }, orderBy: { plannedDate: 'asc' } }),
    db.siteReport.findMany({ where: { projectId }, orderBy: { reportDate: 'asc' } }),
    db.siteDelay.findMany({ where: { projectId, status: { not: 'RESOLVED' } } }),
    db.inspection.findMany({ where: { projectId, resolved: false } }),
    db.expense.findMany({
      where: { projectId, status: { in: ['APPROVED', 'PAID'] } },
      orderBy: { expenseDate: 'asc' },
    }),
    db.procurementRequest.findMany({
      where: { projectId },
      include: { purchaseOrder: { include: { invoices: true } } },
      orderBy: { createdAt: 'asc' },
    }),
  ]);
  const canViewBudget = rolePermissions[actor.role].includes('BUDGET_VIEW');
  const schedule = scheduleSummary(items);
  const orders = procurement.flatMap((request) =>
    request.purchaseOrder ? [request.purchaseOrder] : [],
  );
  const paidInvoices = orders
    .flatMap((order) => order.invoices)
    .filter((invoice) => invoice.status === 'PAID')
    .reduce((sum, invoice) => sum.plus(invoice.amount), new Prisma.Decimal(0));
  const expenseActual = expenses.reduce(
    (sum, expense) => sum.plus(expense.amount),
    new Prisma.Decimal(0),
  );
  const actual = expenseActual.plus(paidInvoices);
  const grossCommitment = orders
    .filter((order) => order.status !== 'CANCELLED')
    .reduce((sum, order) => sum.plus(order.total), new Prisma.Decimal(0));
  const commitment = Prisma.Decimal.max(grossCommitment.minus(paidInvoices), 0);
  const budget = Number(project.budget);
  const actualNumber = Number(actual);
  const commitmentNumber = Number(commitment);
  const utilization = budget > 0 ? (actualNumber / budget) * 100 : 0;
  const statusDistribution = [...new Set(items.map((item) => item.status))].map((status) => ({
    label: status,
    value: items.filter((item) => item.status === status).length,
  }));
  const chartRows = (
    items.some((item) => item.kind === 'MILESTONE')
      ? items.filter((item) => item.kind === 'MILESTONE')
      : items
  ).map((item) => ({ name: item.name, progress: item.progress, status: item.status }));
  const generatedAt = new Date();

  res.type('application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${project.code}-summary.pdf"`);
  const pdf = new PDFDocument({
    margin: 44,
    size: 'A4',
    bufferPages: true,
    info: { Title: `${project.code} - ${project.name} analytics report`, Author: 'BuildTrack' },
  });
  pdf.pipe(res);

  pdf.rect(0, 0, 595.28, 98).fill(deepGreen);
  pdf.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(23).text('BuildTrack', 44, 31);
  pdf
    .fillColor('#B8D6C2')
    .fontSize(7)
    .text('CONSTRUCTION OPERATIONS REPORT', 44, 62, { characterSpacing: 1.1 });
  pdf
    .fillColor('#FFFFFF')
    .fontSize(9)
    .text('PROJECT ANALYTICS', 420, 38, { width: 130, align: 'right' });
  pdf.fillColor(text).fontSize(20).text(project.name, 44, 122, { width: 500 });
  pdf.fillColor(green).fontSize(9).text(project.code, 44, 151);
  pdf
    .fillColor(muted)
    .font('Helvetica')
    .fontSize(8.5)
    .text(
      `${project.city}, ${project.state} | ${label(project.status)} | ${date(project.startDate)} to ${date(project.endDate)}`,
      44,
      169,
      { width: 500 },
    );

  metricCard(pdf, 44, 202, 121, 'RECORDED COMPLETION', `${schedule.progress}%`, schedule.basis);
  metricCard(
    pdf,
    174,
    202,
    121,
    'OVERDUE ITEMS',
    String(schedule.overdue),
    `${schedule.completed} of ${schedule.total} complete`,
  );
  metricCard(
    pdf,
    304,
    202,
    121,
    'OPEN SITE CONTROLS',
    String(delays.length + inspections.length),
    `${delays.length} delay | ${inspections.length} inspection`,
  );
  metricCard(
    pdf,
    434,
    202,
    117,
    'BUDGET UTILISATION',
    canViewBudget ? `${utilization.toFixed(1)}%` : 'Restricted',
    canViewBudget ? 'Actual / approved budget' : 'Permission required',
  );

  sectionHeading(
    pdf,
    'Operational summary',
    'Current project controls computed from saved records.',
    302,
  );
  roundedBox(pdf, 44, 354, 507, 122, '#FBFCFB');
  pdf.fillColor(text).font('Helvetica-Bold').fontSize(10).text('Schedule', 58, 368);
  pdf
    .fillColor(muted)
    .font('Helvetica')
    .fontSize(8)
    .text(
      `${schedule.completed} completed of ${schedule.total} saved items. ${schedule.overdue} incomplete item(s) are past their planned date.`,
      58,
      386,
      { width: 225, lineGap: 2 },
    );
  pdf.fillColor('#EDF1EE').roundedRect(58, 423, 220, 9, 4).fill();
  if (schedule.progress > 0)
    pdf
      .fillColor(green)
      .roundedRect(58, 423, Math.max(4, (Math.min(100, schedule.progress) / 100) * 220), 9, 4)
      .fill();
  pdf.fillColor(text).font('Helvetica-Bold').fontSize(10).text('Project controls', 313, 368);
  pdf
    .fillColor(muted)
    .font('Helvetica')
    .fontSize(8)
    .text(
      `Open delays: ${delays.length}\nUnresolved inspections: ${inspections.length}\nDated site reports: ${reports.length}\nProcurement requests: ${procurement.length}`,
      313,
      386,
      { width: 210, lineGap: 4 },
    );

  if (canViewBudget) {
    sectionHeading(
      pdf,
      'Financial position',
      'Approved actuals and current purchase-order commitments.',
      510,
    );
    roundedBox(pdf, 44, 560, 507, 97, '#FBFCFB');
    const financeValues = [
      ['Approved budget', money(budget, actor.organization.currency)],
      ['Approved actual', money(actualNumber, actor.organization.currency)],
      ['Open commitment', money(commitmentNumber, actor.organization.currency)],
      ['Remaining after actual', money(budget - actualNumber, actor.organization.currency)],
    ];
    financeValues.forEach(([name, value], index) => {
      const x = 58 + index * 121;
      pdf
        .fillColor(muted)
        .font('Helvetica-Bold')
        .fontSize(6.5)
        .text(name!.toUpperCase(), x, 578, { width: 110 });
      pdf.fillColor(text).fontSize(10.5).text(value!, x, 598, { width: 110 });
    });
    pdf
      .fillColor(muted)
      .font('Helvetica')
      .fontSize(7)
      .text(
        'Actual = approved/paid expenses + paid invoices. Commitment = non-cancelled PO total - paid invoices.',
        58,
        632,
        { width: 470 },
      );
  }

  sectionHeading(
    pdf,
    'Data integrity',
    'The report does not interpolate missing progress or expose restricted financial records.',
    canViewBudget ? 695 : 520,
  );
  pdf
    .fillColor(muted)
    .font('Helvetica')
    .fontSize(8)
    .text(
      'Charts on the following page use persisted project records. Rule-based metrics are identified as computations; no ML probability is included without holdout validation.',
      44,
      canViewBudget ? 746 : 571,
      { width: 500, lineGap: 2 },
    );

  pdf.addPage();
  sectionHeading(
    pdf,
    'Visual analytics',
    "Line, bar and doughnut charts generated from this project's database records.",
    46,
  );
  pdf
    .fillColor(text)
    .font('Helvetica-Bold')
    .fontSize(11)
    .text('Recorded project completion trend', 44, 102);
  pdf
    .fillColor(muted)
    .font('Helvetica')
    .fontSize(7.5)
    .text(
      'Each point is a saved site-report observation. Missing dates are not estimated.',
      44,
      119,
    );
  roundedBox(pdf, 44, 139, 507, 180, '#FBFCFB');
  lineChart(
    pdf,
    reports.map((report) => ({ date: report.reportDate, progress: report.reportedProgress })),
    57,
    151,
    480,
    150,
  );

  pdf
    .fillColor(text)
    .font('Helvetica-Bold')
    .fontSize(11)
    .text('Milestone and work progress', 44, 348);
  pdf
    .fillColor(muted)
    .font('Helvetica')
    .fontSize(7.5)
    .text(
      `Bars use saved percentages from ${chartRows.length ? (items.some((item) => item.kind === 'MILESTONE') ? 'milestones' : 'work items') : 'the project schedule'}.`,
      44,
      365,
    );
  roundedBox(pdf, 44, 385, 507, 214, '#FBFCFB');
  horizontalBars(pdf, chartRows, 58, 400, 478);

  pdf.fillColor(text).font('Helvetica-Bold').fontSize(11).text('Work status distribution', 44, 628);
  pdf
    .fillColor(muted)
    .font('Helvetica')
    .fontSize(7.5)
    .text('Each schedule item is counted once under its current persisted status.', 44, 645);
  roundedBox(pdf, 44, 666, 507, 122, '#FBFCFB');
  doughnut(pdf, statusDistribution, 124, 727, 43);

  footerPages(pdf, generatedAt);
  pdf.end();
});

reportsRouter.get('/expenses.xlsx', requirePermission('REPORT_EXPORT'), async (req, res) => {
  const projectId = z.uuid().parse(req.query.projectId);
  const actor = req.identity!;
  const project = await db.$transaction((tx) =>
    accessProject(tx, projectId, actor, 'REPORT_EXPORT'),
  );
  const expenses = await db.expense.findMany({
    where: { projectId },
    include: { vendor: true, createdBy: true },
    orderBy: { expenseDate: 'asc' },
  });
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'BuildTrack';
  workbook.created = new Date();
  const sheet = workbook.addWorksheet('Expenses');
  sheet.columns = [
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Category', key: 'category', width: 22 },
    { header: 'Description', key: 'description', width: 36 },
    { header: 'Vendor / submitter', key: 'source', width: 26 },
    { header: 'Reference', key: 'reference', width: 20 },
    { header: 'Status', key: 'status', width: 14 },
    { header: `Amount (${actor.organization.currency})`, key: 'amount', width: 20 },
  ];
  for (const expense of expenses)
    sheet.addRow({
      date: expense.expenseDate.toISOString().slice(0, 10),
      category: expense.category,
      description: expense.description,
      source: expense.vendor?.name || expense.createdBy?.name || '',
      reference: expense.sourceRef || '',
      status: expense.status,
      amount: Number(expense.amount),
    });
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0B1F33' },
  };
  sheet.getColumn('amount').numFmt = '#,##0.00';
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  const bytes = await workbook.xlsx.writeBuffer();
  res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${project.code}-expenses.xlsx"`);
  return res.send(Buffer.from(bytes));
});

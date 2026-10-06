import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../auth/auth.middleware';
import { projectScope } from '../projects/project-access';
import { db } from '../../shared/db';
import { ok } from '../../shared/http';

export const assistantRouter = Router();
const messageSchema = z.object({
  message: z.string().trim().min(1).max(500),
  page: z.string().trim().max(120).default('/'),
});

const pageGuidance: Record<string, string> = {
  workspace: 'The workspace summarizes your account, organization and recent activity.',
  projects: 'Projects contains scoped project records, assignments, dates, budgets and controlled status changes.',
  schedule: 'The schedule tracks milestones and tasks. Dependencies and planned dates are validated before updates are saved.',
  site: 'Site operations records daily reports, delays and inspections for the selected project.',
  equipment: 'Equipment tracks availability, exclusive allocations, releases and maintenance conflicts.',
  inventory: 'Inventory tracks materials, stock movements and approval-based material requests.',
  workforce: 'Workforce tracks workers, project assignments, attendance, shifts and approved-hours cost estimates.',
  procurement: 'Procurement covers vendors, requests, approvals, purchase orders, receipts and invoices.',
  finance: 'Finance combines project budgets, expenses, paid invoices and outstanding purchase commitments.',
  documents: 'Documents stores authorized project files as versioned records and provides PDF and XLSX reports.',
  analytics: 'Analytics combines schedule, site, workforce and financial signals into transparent project risk indicators.',
  'ml-insights': 'ML Insights trains from authorized historical outcomes, shows model readiness and never invents predictions when history is insufficient.',
  notifications: 'Notifications shows workflow updates addressed to your account and lets you mark them read.',
  profile: 'Profile lets you update your own name and phone number.',
  security: 'Security lets you change your password and revoke your current session by signing out.',
  users: 'Team directory lets administrators create, edit and activate or deactivate organization accounts.',
};

function pageKey(page: string) {
  if (page.includes('/schedule')) return 'schedule';
  if (page.includes('/site')) return 'site';
  return page.split('?')[0]?.split('/').filter(Boolean)[0] || 'landing';
}

function publicAnswer(message: string, page: string) {
  const text = message.toLowerCase();
  if (text.includes('price') || text.includes('cost'))
    return 'BuildTrack is currently a project implementation rather than a commercial subscription. Sign in or create an account to explore the workspace.';
  if (text.includes('login') || text.includes('sign in'))
    return 'Choose “Sign in” and use your organization account. The local demonstration accounts are listed in the project README.';
  if (text.includes('feature') || text.includes('what can'))
    return 'BuildTrack connects project schedules, site reporting, equipment, inventory, workforce, procurement, finance, documents and analytics in one role-aware workspace.';
  if (text.includes('ai') || text.includes('machine learning') || text.includes('ml'))
    return 'The current assistant provides secure contextual guidance. Planned ML opportunities include delay prediction, cost forecasting, safety-risk detection, document classification and equipment maintenance prediction.';
  const guidance = pageGuidance[pageKey(page)];
  return guidance || 'I can explain BuildTrack features, account access and how the construction workspace is organized.';
}

assistantRouter.post('/public', (req, res) => {
  const input = messageSchema.parse(req.body);
  return ok(res, {
    answer: publicAnswer(input.message, input.page),
    mode: 'context engine',
    privateDataUsed: false,
  });
});

assistantRouter.post('/message', authenticate, async (req, res) => {
  const input = messageSchema.parse(req.body);
  const actor = req.identity!;
  const projectWhere = projectScope(actor);
  const [projects, activeProjects, overdueItems, unreadNotifications] = await Promise.all([
    db.project.count({ where: projectWhere }),
    db.project.count({ where: { ...projectWhere, status: 'ACTIVE' } }),
    db.workItem.count({
      where: {
        project: projectWhere,
        status: { not: 'COMPLETED' },
        plannedDate: { lt: new Date(new Date().toISOString().slice(0, 10)) },
      },
    }),
    db.notification.count({ where: { userId: actor.id, readAt: null } }),
  ]);
  const text = input.message.toLowerCase();
  let answer: string;
  if (/summar|status|attention|overview/.test(text)) {
    answer = `You can access ${projects} project${projects === 1 ? '' : 's'}, including ${activeProjects} active. There are ${overdueItems} overdue schedule item${overdueItems === 1 ? '' : 's'} and ${unreadNotifications} unread notification${unreadNotifications === 1 ? '' : 's'}. Open Analytics for the combined risk and financial view.`;
  } else if (/machine learning|\bml\b|predict|forecast/.test(text)) {
    answer = 'BuildTrack now includes schedule-delay classification, material-demand forecasting, cost-at-completion regression and predictive equipment maintenance. Strong next candidates are safety-risk scoring and document classification. Existing rule-based metrics remain visible as explainable baselines.';
  } else if (/help|how|what|explain/.test(text)) {
    answer = pageGuidance[pageKey(input.page)] || publicAnswer(input.message, input.page);
  } else {
    const guidance = pageGuidance[pageKey(input.page)] || 'This page is part of your BuildTrack workspace.';
    answer = `${guidance} Ask me for a workspace summary, how to use this page, or where machine learning could help.`;
  }
  return ok(res, {
    answer,
    mode: 'secure context engine',
    privateDataUsed: true,
    context: { projects, activeProjects, overdueItems, unreadNotifications },
  });
});

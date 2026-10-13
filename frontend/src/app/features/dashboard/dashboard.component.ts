import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
import { ReportService } from '../../core/services/report.service';
import { Analytics, ReportSummary } from '../../core/models/domain.model';
import { ChartComponent } from '../../shared/chart/chart.component';

interface StatCard {
  icon: string;
  label: string;
  value: string;
  note: string;
  accent: string;
}

interface QuickLink {
  path: string;
  icon: string;
  label: string;
  desc: string;
}

const STATS_BY_ROLE: Record<string, StatCard[]> = {
  admin: [
    { icon: 'group', label: 'Registered users', value: '—', note: 'Live in Milestone 4', accent: 'amber' },
    { icon: 'business', label: 'Total projects', value: '0 / 0', note: 'Live in Milestone 2', accent: 'blue' },
    { icon: 'inventory_2', label: 'Inventory SKUs', value: '0', note: 'Live in Milestone 3', accent: 'teal' },
    { icon: 'insights', label: 'System analytics', value: '—', note: 'Live in Milestone 4', accent: 'purple' },
  ],
  project_manager: [
    { icon: 'business', label: 'My projects', value: '0', note: 'Live in Milestone 2', accent: 'blue' },
    { icon: 'timeline', label: 'Milestones tracked', value: '0 / 0', note: 'Live in Milestone 2', accent: 'amber' },
    { icon: 'groups', label: 'Workforce recorded', value: '0', note: 'Live in Milestone 2', accent: 'teal' },
    { icon: 'account_balance_wallet', label: 'Budget utilised', value: '—', note: 'Live in Milestone 4', accent: 'purple' },
  ],
  site_engineer: [
    { icon: 'timeline', label: 'Site progress', value: '0%', note: 'Live in Milestone 2', accent: 'amber' },
    { icon: 'precision_manufacturing', label: 'Machinery on site', value: '0', note: 'Live in Milestone 2', accent: 'blue' },
    { icon: 'inventory_2', label: 'Material stock', value: '0', note: 'Live in Milestone 3', accent: 'teal' },
  ],
  contractor: [
    { icon: 'groups', label: 'My workers', value: '0', note: 'Live in Milestone 2', accent: 'teal' },
    { icon: 'shopping_cart', label: 'Material requests', value: '0', note: 'Live in Milestone 3', accent: 'amber' },
  ],
  worker: [
    { icon: 'event_available', label: 'My attendance', value: '—', note: 'Live in Milestone 2', accent: 'teal' },
    { icon: 'assignment', label: 'My tasks', value: '0', note: 'Live in Milestone 2', accent: 'blue' },
  ],
  client: [
    { icon: 'business', label: 'My projects', value: '0', note: 'Live in Milestone 2', accent: 'blue' },
    { icon: 'timeline', label: 'Overall progress', value: '0%', note: 'Live in Milestone 2', accent: 'amber' },
    { icon: 'summarize', label: 'Reports available', value: '0', note: 'Live in Milestone 3', accent: 'purple' },
  ],
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  project_manager: 'Project Manager',
  site_engineer: 'Site Engineer',
  contractor: 'Contractor',
  worker: 'Worker',
  client: 'Client',
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, ChartComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  summary = signal<ReportSummary | null>(null);
  analytics = signal<Analytics | null>(null);

  constructor(public authService: AuthService, private reportService: ReportService) {}

  ngOnInit(): void {
    // Only these roles are allowed to call /api/reports/summary
    if (this.authService.hasRole('admin', 'project_manager', 'client')) {
      this.reportService.getSummary().subscribe({
        next: (data) => this.summary.set(data),
        error: () => this.summary.set(null),
      });
      this.reportService.getAnalytics().subscribe({
        next: (data) => this.analytics.set(data),
        error: () => this.analytics.set(null),
      });
    }
  }

  stats = computed<StatCard[]>(() => {
    const role = this.authService.currentUser()?.role || 'worker';
    const s = this.summary();

    // Real, database-backed numbers for roles that can access the summary
    if (s && role === 'admin') {
      return [
        { icon: 'business', label: 'Total projects', value: String(s.total_projects), note: `${s.active_projects} in progress`, accent: 'blue' },
        { icon: 'groups', label: 'Workers registered', value: String(s.total_workers), note: 'Live from database', accent: 'teal' },
        { icon: 'inventory_2', label: 'Low stock items', value: String(s.low_stock_items), note: 'At or below reorder level', accent: 'amber' },
        { icon: 'shopping_cart', label: 'Pending procurement', value: String(s.pending_procurement_requests), note: 'Awaiting approval', accent: 'purple' },
      ];
    }
    if (s && role === 'project_manager') {
      return [
        { icon: 'business', label: 'Projects', value: String(s.total_projects), note: `${s.active_projects} in progress`, accent: 'blue' },
        { icon: 'account_balance_wallet', label: 'Total budget', value: '₹' + s.total_budget.toLocaleString('en-IN'), note: '₹' + s.total_spent.toLocaleString('en-IN') + ' spent so far', accent: 'purple' },
        { icon: 'groups', label: 'Workforce', value: String(s.total_workers), note: `${s.present_attendance_records} attendance marked present`, accent: 'teal' },
        { icon: 'shopping_cart', label: 'Pending procurement', value: String(s.pending_procurement_requests), note: 'Awaiting approval', accent: 'amber' },
      ];
    }
    if (s && role === 'client') {
      return [
        { icon: 'business', label: 'Projects', value: String(s.total_projects), note: `${s.active_projects} in progress`, accent: 'blue' },
        { icon: 'account_balance_wallet', label: 'Total budget', value: '₹' + s.total_budget.toLocaleString('en-IN'), note: 'Across all projects', accent: 'purple' },
      ];
    }
    return STATS_BY_ROLE[role] || STATS_BY_ROLE['worker'];
  });

  roleLabel = computed(() => {
    const role = this.authService.currentUser()?.role || '';
    return ROLE_LABELS[role] || role;
  });

  /** Delivery checklist across Milestones 1-3 */
  deliverables = [
    { label: 'JWT authentication, password reset (emailed link) & 6-role access control', done: true },
    { label: 'Projects, milestones with deadlines, resources & machinery', done: true },
    { label: 'Workforce, attendance roster & absence alerts', done: true },
    { label: 'Inventory with low-stock alerts, procurement approval workflow', done: true },
    { label: 'Budget & expense tracking with 90% budget alerts', done: true },
    { label: 'Document uploads, notifications, charts & PDF / Excel / CSV export', done: true },
  ];

  quickLinks: QuickLink[] = [
    { path: '/projects', icon: 'business', label: 'Projects', desc: 'Schedules, status & budgets' },
    { path: '/workforce', icon: 'groups', label: 'Workforce', desc: 'Workers & daily attendance' },
    { path: '/inventory', icon: 'inventory_2', label: 'Inventory', desc: 'Stock & low-stock alerts' },
    { path: '/documents', icon: 'folder_open', label: 'Documents', desc: 'Drawings, permits, invoices' },
    { path: '/notifications', icon: 'notifications', label: 'Notifications', desc: 'Alerts for your account' },
    { path: '/reports', icon: 'summarize', label: 'Reports', desc: 'Charts and exports' },
  ];

  keys(o: Record<string, number> | undefined): string[] {
    return Object.keys(o ?? {});
  }

  one(label: string, o: Record<string, number> | undefined) {
    return [{ label, data: Object.values(o ?? {}) }];
  }

  budgetLabels(): string[] {
    return (this.analytics()?.budget_vs_spent ?? []).map((b) => b.project);
  }

  budgetSeries() {
    const rows = this.analytics()?.budget_vs_spent ?? [];
    return [
      { label: 'Budget', data: rows.map((r) => r.budget) },
      { label: 'Spent', data: rows.map((r) => r.spent) },
    ];
  }
}

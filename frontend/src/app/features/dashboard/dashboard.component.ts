import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

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
  imports: [CommonModule, RouterLink, MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  constructor(public authService: AuthService) {}

  stats = computed<StatCard[]>(() => {
    const role = this.authService.currentUser()?.role || 'worker';
    return STATS_BY_ROLE[role] || STATS_BY_ROLE['worker'];
  });

  roleLabel = computed(() => {
    const role = this.authService.currentUser()?.role || '';
    return ROLE_LABELS[role] || role;
  });

  /** Milestone 1 delivery checklist — what's actually done */
  deliverables = [
    { label: 'JWT authentication (signup, login, /me)', done: true },
    { label: 'Password reset flow', done: true },
    { label: 'Role-based access control (6 roles)', done: true },
    { label: 'Database schema — all 10 tables', done: true },
    { label: 'Angular skeleton + Material & Bootstrap', done: true },
    { label: 'Backend test suite (10 pytest tests passing)', done: true },
  ];

  quickLinks: QuickLink[] = [
    { path: '/projects', icon: 'business', label: 'Projects', desc: 'Project records & status' },
    { path: '/workforce', icon: 'groups', label: 'Workforce', desc: 'Workers & attendance' },
    { path: '/inventory', icon: 'inventory_2', label: 'Inventory', desc: 'Materials & stock' },
    { path: '/reports', icon: 'summarize', label: 'Reports', desc: 'Progress & budget reports' },
  ];
}

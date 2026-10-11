import { Component, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { IconComponent } from '../../core/icon.component';
import { AccountOverview, ApiResponse, errorMessage, roleLabel } from '../../core/models';
@Component({
  selector: 'bt-overview',
  imports: [IconComponent, RouterLink, DatePipe],
  templateUrl: './overview.component.html',
})
export class OverviewComponent {
  readonly auth = inject(AuthService);
  private http = inject(HttpClient);
  readonly data = signal<AccountOverview | null>(null);
  readonly error = signal('');
  readonly loading = signal(true);
  readonly label = roleLabel;
  readonly animated = signal({
    activeProjects: 0,
    activeWorkforce: 0,
    budgetUtilization: 0,
    healthyProjects: 0,
  });
  readonly animatedProgress = signal<Record<string, number>>({});
  readonly featuredProject = computed(() => {
    const projects = this.data()?.operations.projects || [];
    return projects.find((project) => project.status === 'ACTIVE') || projects[0] || null;
  });
  readonly atRiskProjects = computed(() =>
    [...(this.data()?.operations.projects || [])]
      .filter((project) => project.riskScore >= 20 || project.overdue > 0)
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 4),
  );
  constructor() {
    this.load();
  }
  load() {
    this.error.set('');
    this.loading.set(true);
    this.http.get<ApiResponse<AccountOverview>>('/api/v1/account/overview').subscribe({
      next: (r) => {
        this.data.set(r.data);
        this.loading.set(false);
        this.animateOperations(r.data);
      },
      error: (e) => {
        this.error.set(errorMessage(e));
        this.loading.set(false);
      },
    });
  }
  get firstName() {
    return this.auth.user()?.name.split(' ')[0];
  }
  activity(action: string) {
    if (action.startsWith('PROJECT_STATUS_'))
      return `Changed a project status to ${roleLabel(action.slice('PROJECT_STATUS_'.length))}`;
    return (
      (
        {
          LOGIN: 'Signed in to BuildTrack',
          LOGOUT: 'Signed out of a session',
          REGISTER: 'Created your account',
          PROFILE_UPDATED: 'Updated your profile',
          PASSWORD_CHANGED: 'Changed your password',
          PASSWORD_RESET: 'Reset your password',
          USER_CREATED: 'Added a team member',
          USER_UPDATED: 'Updated a team member',
          USER_RESET_REQUESTED: 'Requested a team member password reset',
          PROJECT_CREATED: 'Created a project',
          PROJECT_UPDATED: 'Updated a project',
          SCHEDULE_CREATED: 'Added a schedule item',
          SCHEDULE_UPDATED: 'Updated a schedule item',
          SITE_REPORT_CREATED: 'Created a daily site report',
          SITE_REPORT_UPDATED: 'Corrected a daily site report',
          DELAY_REPORTED: 'Reported a project delay',
          DELAY_UPDATED: 'Updated a project delay',
          INSPECTION_RECORDED: 'Recorded a site inspection',
          INSPECTION_UPDATED: 'Updated a site inspection',
          EQUIPMENT_ALLOCATED: 'Allocated equipment to the project',
          EQUIPMENT_RELEASED: 'Released equipment from the project',
          PROCUREMENT_REQUEST_CREATED: 'Submitted a procurement request',
          PROCUREMENT_REQUEST_APPROVED: 'Approved a procurement request',
          PURCHASE_ORDER_CREATED: 'Issued a purchase order',
          GOODS_RECEIVED: 'Recorded a material delivery',
          BUDGET_ALLOCATED: 'Allocated a project budget category',
          EXPENSE_CREATED: 'Submitted a project expense',
          EXPENSE_APPROVED: 'Approved a project expense',
        } as Record<string, string>
      )[action] || action
    );
  }
  private animateOperations(summary: AccountOverview) {
    const targets = {
      activeProjects: summary.operations.summary.activeProjects,
      activeWorkforce: summary.operations.summary.activeWorkforce || 0,
      budgetUtilization: Number(summary.operations.summary.budgetUtilization || 0),
      healthyProjects: summary.operations.summary.healthyProjects,
    };
    const progressTargets = Object.fromEntries(
      summary.operations.projects.map((project) => [project.id, project.progress]),
    );
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.animated.set(targets);
      this.animatedProgress.set(progressTargets);
      return;
    }
    const start = performance.now();
    const duration = 760;
    const frame = (now: number) => {
      const linear = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - linear, 3);
      this.animated.set({
        activeProjects: Math.round(targets.activeProjects * eased),
        activeWorkforce: Math.round(targets.activeWorkforce * eased),
        budgetUtilization: Number((targets.budgetUtilization * eased).toFixed(1)),
        healthyProjects: Math.round(targets.healthyProjects * eased),
      });
      this.animatedProgress.set(
        Object.fromEntries(
          Object.entries(progressTargets).map(([id, value]) => [id, Math.round(value * eased)]),
        ),
      );
      if (linear < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
}

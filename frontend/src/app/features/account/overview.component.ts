import { Component, inject, signal } from '@angular/core';
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
        } as Record<string, string>
      )[action] || action
    );
  }
}

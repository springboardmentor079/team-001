import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  project_manager: 'Project Manager',
  site_engineer: 'Site Engineer',
  contractor: 'Contractor',
  worker: 'Worker',
  client: 'Client',
};

const ROLE_ACCESS: Record<string, string[]> = {
  admin: ['Full system access', 'User management', 'All projects', 'All reports'],
  project_manager: ['Own projects', 'Workforce & resources', 'Procurement', 'Reports'],
  site_engineer: ['Site progress', 'Milestones', 'Machinery on site'],
  contractor: ['Assigned workers', 'Material requests'],
  worker: ['Own attendance', 'Assigned tasks'],
  client: ['Own project progress', 'Project reports'],
};

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent {
  constructor(public authService: AuthService) {}

  user = computed(() => this.authService.currentUser());

  roleLabel = computed(() => {
    const role = this.user()?.role || '';
    return ROLE_LABELS[role] || role;
  });

  accessList = computed(() => {
    const role = this.user()?.role || 'worker';
    return ROLE_ACCESS[role] || [];
  });

  initials = computed(() => {
    const name = this.user()?.full_name || '';
    return name
      .split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  });
}

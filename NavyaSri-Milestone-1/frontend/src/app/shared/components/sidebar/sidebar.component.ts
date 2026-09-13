import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { UserRole } from '../../../core/models/user.model';

export interface SidebarNavItem {
  label: string;
  icon: string;
  route: string;
}

/**
 * Role-based sidebar navigation, per the navigation structure defined for
 * Milestone 1. Routes not yet implemented (future milestones) point at the
 * shared "coming soon" placeholder page rather than fake functionality.
 */
const NAV_ITEMS_BY_ROLE: Record<UserRole, SidebarNavItem[]> = {
  [UserRole.ADMIN]: [
    { label: 'Dashboard', icon: 'space_dashboard', route: '/dashboard/admin' },
    { label: 'Users', icon: 'group', route: '/admin/users' },
    { label: 'Projects', icon: 'apartment', route: '/projects' },
    { label: 'Reports', icon: 'summarize', route: '/coming-soon/reports' },
    { label: 'Profile', icon: 'person', route: '/profile' },
  ],
  [UserRole.PROJECT_MANAGER]: [
    { label: 'Dashboard', icon: 'space_dashboard', route: '/dashboard/project-manager' },
    { label: 'Projects', icon: 'apartment', route: '/projects' },
    { label: 'Milestones', icon: 'flag', route: '/coming-soon/milestones' },
    { label: 'Resources', icon: 'construction', route: '/coming-soon/resources' },
    { label: 'Workforce', icon: 'engineering', route: '/coming-soon/workforce' },
    { label: 'Profile', icon: 'person', route: '/profile' },
  ],
  [UserRole.SITE_ENGINEER]: [
    { label: 'Dashboard', icon: 'space_dashboard', route: '/dashboard/site-engineer' },
    { label: 'Site Progress', icon: 'timeline', route: '/coming-soon/site-progress' },
    { label: 'Projects', icon: 'apartment', route: '/projects' },
    { label: 'Profile', icon: 'person', route: '/profile' },
  ],
  [UserRole.CONTRACTOR]: [
    { label: 'Dashboard', icon: 'space_dashboard', route: '/dashboard/contractor' },
    { label: 'Projects', icon: 'apartment', route: '/projects' },
    { label: 'Workforce', icon: 'engineering', route: '/coming-soon/workforce' },
    { label: 'Profile', icon: 'person', route: '/profile' },
  ],
  [UserRole.WORKER]: [
    { label: 'Dashboard', icon: 'space_dashboard', route: '/dashboard/worker' },
    { label: 'Attendance', icon: 'fact_check', route: '/coming-soon/attendance' },
    { label: 'Profile', icon: 'person', route: '/profile' },
  ],
  [UserRole.CLIENT]: [
    { label: 'Dashboard', icon: 'space_dashboard', route: '/dashboard/client' },
    { label: 'Projects', icon: 'apartment', route: '/projects' },
    { label: 'Reports', icon: 'summarize', route: '/coming-soon/reports' },
    { label: 'Profile', icon: 'person', route: '/profile' },
  ],
};

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatListModule, MatIconModule, MatDividerModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  @Input() role: UserRole | null = null;

  get navItems(): SidebarNavItem[] {
    return this.role ? NAV_ITEMS_BY_ROLE[this.role] : [];
  }
}

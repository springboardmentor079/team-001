import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  path: string;
  icon: string;
  label: string;
  roles: string[]; // which roles can see this item
}

const ALL_ROLES = [
  'admin',
  'project_manager',
  'site_engineer',
  'contractor',
  'worker',
  'client',
];

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', icon: 'dashboard', label: 'Dashboard', roles: ALL_ROLES },
  {
    path: '/projects',
    icon: 'business',
    label: 'Projects',
    roles: ['admin', 'project_manager', 'site_engineer', 'contractor', 'client'],
  },
  {
    path: '/milestones',
    icon: 'timeline',
    label: 'Milestones',
    roles: ['admin', 'project_manager', 'site_engineer', 'client'],
  },
  {
    path: '/resources',
    icon: 'precision_manufacturing',
    label: 'Resources',
    roles: ['admin', 'project_manager', 'site_engineer'],
  },
  {
    path: '/inventory',
    icon: 'inventory_2',
    label: 'Inventory',
    roles: ['admin', 'project_manager', 'site_engineer', 'contractor'],
  },
  {
    path: '/workforce',
    icon: 'groups',
    label: 'Workforce',
    roles: ['admin', 'project_manager', 'contractor'],
  },
  {
    path: '/procurement',
    icon: 'shopping_cart',
    label: 'Procurement',
    roles: ['admin', 'project_manager', 'contractor'],
  },
  {
    path: '/notifications',
    icon: 'notifications',
    label: 'Notifications',
    roles: ALL_ROLES,
  },
  {
    path: '/reports',
    icon: 'summarize',
    label: 'Reports',
    roles: ['admin', 'project_manager', 'client'],
  },
  { path: '/profile', icon: 'person', label: 'Profile', roles: ALL_ROLES },
];

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  project_manager: 'Project Manager',
  site_engineer: 'Site Engineer',
  contractor: 'Contractor',
  worker: 'Worker',
  client: 'Client',
};

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
})
export class ShellComponent {
  sidebarOpen = signal(true);

  constructor(public authService: AuthService, private router: Router) {}

  /** Only show nav items this user's role is allowed to see */
  navItems = computed<NavItem[]>(() => {
    const role = this.authService.currentUser()?.role || 'worker';
    return NAV_ITEMS.filter((item) => item.roles.includes(role));
  });

  roleLabel = computed(() => {
    const role = this.authService.currentUser()?.role || '';
    return ROLE_LABELS[role] || role;
  });

  initials = computed(() => {
    const name = this.authService.currentUser()?.full_name || '';
    return name
      .split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  });

  toggleSidebar(): void {
    this.sidebarOpen.set(!this.sidebarOpen());
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

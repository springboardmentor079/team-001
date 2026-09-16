import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // ---- Public auth routes ----
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then(
        (m) => m.RegisterComponent
      ),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent
      ),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent
      ),
  },

  // ---- Protected routes, rendered inside the app shell ----
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
      },
      {
        path: 'projects',
        loadComponent: () =>
          import('./features/modules/projects/projects.component').then(
            (m) => m.ProjectsComponent
          ),
      },
      {
        path: 'milestones',
        loadComponent: () =>
          import('./features/modules/milestones/milestones.component').then(
            (m) => m.MilestonesComponent
          ),
      },
      {
        path: 'resources',
        loadComponent: () =>
          import('./features/modules/resources/resources.component').then(
            (m) => m.ResourcesComponent
          ),
      },
      {
        path: 'inventory',
        loadComponent: () =>
          import('./features/modules/inventory/inventory.component').then(
            (m) => m.InventoryComponent
          ),
      },
      {
        path: 'workforce',
        loadComponent: () =>
          import('./features/modules/workforce/workforce.component').then(
            (m) => m.WorkforceComponent
          ),
      },
      {
        path: 'procurement',
        loadComponent: () =>
          import('./features/modules/procurement/procurement.component').then(
            (m) => m.ProcurementComponent
          ),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/modules/notifications/notifications.component').then(
            (m) => m.NotificationsComponent
          ),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/modules/reports/reports.component').then(
            (m) => m.ReportsComponent
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/modules/profile/profile.component').then(
            (m) => m.ProfileComponent
          ),
      },
    ],
  },

  { path: '**', redirectTo: 'login' },
];

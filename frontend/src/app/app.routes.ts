import { Routes } from '@angular/router';
import {
  authGuard,
  adminGuard,
  projectGuard,
  resourceGuard,
  inventoryGuard,
  workforceGuard,
  procurementGuard,
  financeGuard,
  documentGuard,
  analyticsGuard,
} from './core/auth.guard';
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/landing/landing.component').then((m) => m.LandingComponent),
    title: 'BuildTrack | Construction intelligence, connected',
  },
  ...['login', 'register', 'forgot-password', 'reset-password'].map((path) => ({
    path,
    loadComponent: () => import('./features/auth/auth.component').then((m) => m.AuthComponent),
    data: { mode: path },
    title: 'BuildTrack | Welcome',
  })),
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: 'analytics',
        canActivate: [analyticsGuard],
        loadComponent: () => import('./features/analytics/analytics.component').then((m) => m.AnalyticsComponent),
        title: 'Analytics & insights | BuildTrack',
      },
      {
        path: 'ml-insights',
        canActivate: [analyticsGuard],
        loadComponent: () => import('./features/ml/ml-insights.component').then((m) => m.MlInsightsComponent),
        title: 'ML insights | BuildTrack',
      },
      {
        path: 'documents',
        canActivate: [documentGuard],
        loadComponent: () => import('./features/records/records.component').then((m) => m.RecordsComponent),
        title: 'Documents & reports | BuildTrack',
      },
      {
        path: 'notifications',
        loadComponent: () => import('./features/notifications/notifications.component').then((m) => m.NotificationsComponent),
        title: 'Notifications | BuildTrack',
      },
      {
        path: 'finance',
        canActivate: [financeGuard],
        loadComponent: () => import('./features/finance/finance.component').then((m) => m.FinanceComponent),
        title: 'Budgets & expenses | BuildTrack',
      },
      {
        path: 'procurement',
        canActivate: [procurementGuard],
        loadComponent: () => import('./features/procurement/procurement.component').then((m) => m.ProcurementComponent),
        title: 'Procurement | BuildTrack',
      },
      {
        path: 'workforce',
        canActivate: [workforceGuard],
        loadComponent: () => import('./features/workforce/workforce.component').then((m) => m.WorkforceComponent),
        title: 'Workforce | BuildTrack',
      },
      {
        path: 'inventory',
        canActivate: [inventoryGuard],
        loadComponent: () =>
          import('./features/inventory/inventory.component').then((m) => m.InventoryComponent),
        title: 'Inventory | BuildTrack',
      },
      {
        path: 'equipment',
        canActivate: [resourceGuard],
        loadComponent: () =>
          import('./features/equipment/equipment.component').then((m) => m.EquipmentComponent),
        title: 'Equipment | BuildTrack',
      },
      ...['projects/:id/schedule', 'projects/:id/site'].map((path) => ({
        path,
        canActivate: [projectGuard],
        loadComponent: () =>
          path.endsWith('schedule')
            ? import('./features/projects/schedule.component').then((m) => m.ScheduleComponent)
            : import('./features/projects/site.component').then((m) => m.SiteComponent),
        title: path.endsWith('schedule')
          ? 'Project schedule | BuildTrack'
          : 'Site operations | BuildTrack',
      })),
      ...['projects', 'projects/:id'].map((path) => ({
        path,
        canActivate: [projectGuard],
        loadComponent: () =>
          import('./features/projects/projects.component').then((m) => m.ProjectsComponent),
        title: 'Projects | BuildTrack',
      })),
      {
        path: 'workspace',
        loadComponent: () =>
          import('./features/account/overview.component').then((m) => m.OverviewComponent),
        title: 'Workspace | BuildTrack',
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/account/profile.component').then((m) => m.ProfileComponent),
        title: 'My profile | BuildTrack',
      },
      {
        path: 'security',
        loadComponent: () =>
          import('./features/account/security.component').then((m) => m.SecurityComponent),
        title: 'Security | BuildTrack',
      },
      {
        path: 'users',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/account/users.component').then((m) => m.UsersComponent),
        title: 'Team directory | BuildTrack',
      },
      { path: '', pathMatch: 'full', redirectTo: 'workspace' },
    ],
  },
  { path: '**', redirectTo: '' },
];

import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { UserRole } from './core/models/user.model';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'auth/login' },

  // ---------------------------------------------------------------------
  // Authentication (public, standalone auth shell — no navbar/sidebar)
  // ---------------------------------------------------------------------
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
    title: 'Sign In | BuildTrack',
  },
  {
    path: 'auth/register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
    title: 'Register | BuildTrack',
  },
  {
    path: 'auth/forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent,
      ),
    title: 'Forgot Password | BuildTrack',
  },
  {
    path: 'auth/reset-password',
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent,
      ),
    title: 'Reset Password | BuildTrack',
  },

  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./shared/components/unauthorized/unauthorized.component').then(
        (m) => m.UnauthorizedComponent,
      ),
    title: 'Access Denied | BuildTrack',
  },

  // ---------------------------------------------------------------------
  // Authenticated app shell (navbar + role-based sidebar)
  // ---------------------------------------------------------------------
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/shared/layout/dashboard-layout.component').then(
        (m) => m.DashboardLayoutComponent,
      ),
    children: [
      {
        path: 'dashboard/admin',
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN] },
        loadComponent: () =>
          import('./features/dashboard/admin-dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent,
          ),
        title: 'Administrator Dashboard | BuildTrack',
      },
      {
        path: 'dashboard/project-manager',
        canActivate: [roleGuard],
        data: { roles: [UserRole.PROJECT_MANAGER] },
        loadComponent: () =>
          import(
            './features/dashboard/project-manager-dashboard/project-manager-dashboard.component'
          ).then((m) => m.ProjectManagerDashboardComponent),
        title: 'Project Manager Dashboard | BuildTrack',
      },
      {
        path: 'dashboard/site-engineer',
        canActivate: [roleGuard],
        data: { roles: [UserRole.SITE_ENGINEER] },
        loadComponent: () =>
          import(
            './features/dashboard/site-engineer-dashboard/site-engineer-dashboard.component'
          ).then((m) => m.SiteEngineerDashboardComponent),
        title: 'Site Engineer Dashboard | BuildTrack',
      },
      {
        path: 'dashboard/contractor',
        canActivate: [roleGuard],
        data: { roles: [UserRole.CONTRACTOR] },
        loadComponent: () =>
          import('./features/dashboard/contractor-dashboard/contractor-dashboard.component').then(
            (m) => m.ContractorDashboardComponent,
          ),
        title: 'Contractor Dashboard | BuildTrack',
      },
      {
        path: 'dashboard/worker',
        canActivate: [roleGuard],
        data: { roles: [UserRole.WORKER] },
        loadComponent: () =>
          import('./features/dashboard/worker-dashboard/worker-dashboard.component').then(
            (m) => m.WorkerDashboardComponent,
          ),
        title: 'Worker Dashboard | BuildTrack',
      },
      {
        path: 'dashboard/client',
        canActivate: [roleGuard],
        data: { roles: [UserRole.CLIENT] },
        loadComponent: () =>
          import('./features/dashboard/client-dashboard/client-dashboard.component').then(
            (m) => m.ClientDashboardComponent,
          ),
        title: 'Client Dashboard | BuildTrack',
      },

      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile/profile.component').then((m) => m.ProfileComponent),
        title: 'My Profile | BuildTrack',
      },

      {
        path: 'projects',
        loadComponent: () =>
          import('./features/projects/project-list/project-list.component').then(
            (m) => m.ProjectListComponent,
          ),
        title: 'Projects | BuildTrack',
      },

      {
        path: 'admin/users',
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN] },
        loadComponent: () =>
          import('./features/admin/users-list/users-list.component').then((m) => m.UsersListComponent),
        title: 'User Management | BuildTrack',
      },

      // -------------------------------------------------------------
      // Placeholder routes for modules planned for future milestones.
      // -------------------------------------------------------------
      {
        path: 'coming-soon/milestones',
        loadComponent: () =>
          import('./features/coming-soon/coming-soon.component').then((m) => m.ComingSoonComponent),
        data: { moduleName: 'Milestones' },
        title: 'Milestones | BuildTrack',
      },
      {
        path: 'coming-soon/resources',
        loadComponent: () =>
          import('./features/coming-soon/coming-soon.component').then((m) => m.ComingSoonComponent),
        data: { moduleName: 'Resources' },
        title: 'Resources | BuildTrack',
      },
      {
        path: 'coming-soon/workforce',
        loadComponent: () =>
          import('./features/coming-soon/coming-soon.component').then((m) => m.ComingSoonComponent),
        data: { moduleName: 'Workforce' },
        title: 'Workforce | BuildTrack',
      },
      {
        path: 'coming-soon/site-progress',
        loadComponent: () =>
          import('./features/coming-soon/coming-soon.component').then((m) => m.ComingSoonComponent),
        data: { moduleName: 'Site Progress' },
        title: 'Site Progress | BuildTrack',
      },
      {
        path: 'coming-soon/reports',
        loadComponent: () =>
          import('./features/coming-soon/coming-soon.component').then((m) => m.ComingSoonComponent),
        data: { moduleName: 'Reports' },
        title: 'Reports | BuildTrack',
      },
      {
        path: 'coming-soon/attendance',
        loadComponent: () =>
          import('./features/coming-soon/coming-soon.component').then((m) => m.ComingSoonComponent),
        data: { moduleName: 'Attendance' },
        title: 'Attendance | BuildTrack',
      },
    ],
  },

  { path: '**', redirectTo: 'auth/login' },
];

/** All roles supported by the platform. Must mirror the backend `UserRole` enum. */
export enum UserRole {
  ADMIN = 'ADMIN',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  SITE_ENGINEER = 'SITE_ENGINEER',
  CONTRACTOR = 'CONTRACTOR',
  WORKER = 'WORKER',
  CLIENT = 'CLIENT',
}

/** Human-readable labels for each role, used throughout the UI. */
export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Administrator',
  [UserRole.PROJECT_MANAGER]: 'Project Manager',
  [UserRole.SITE_ENGINEER]: 'Site Engineer',
  [UserRole.CONTRACTOR]: 'Contractor',
  [UserRole.WORKER]: 'Worker',
  [UserRole.CLIENT]: 'Client',
};

/** Maps each role to the dashboard route it should land on after login. */
export const ROLE_DASHBOARD_ROUTE: Record<UserRole, string> = {
  [UserRole.ADMIN]: '/dashboard/admin',
  [UserRole.PROJECT_MANAGER]: '/dashboard/project-manager',
  [UserRole.SITE_ENGINEER]: '/dashboard/site-engineer',
  [UserRole.CONTRACTOR]: '/dashboard/contractor',
  [UserRole.WORKER]: '/dashboard/worker',
  [UserRole.CLIENT]: '/dashboard/client',
};

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
  phone_number?: string | null;
  profile_image?: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

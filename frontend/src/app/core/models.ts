export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: { page: number; limit: number; total: number; totalPages: number };
}
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  organizationId: string;
  organization: { name: string; currency: string; timezone: string };
  permissions: string[];
  createdAt: string;
  lastLoginAt: string | null;
  mustChangePassword: boolean;
}
export interface Session {
  accessToken: string;
  user: User;
}
export interface AccountOverview {
  sessions: number;
  activity: { id: string; action: string; createdAt: string }[];
  organization: User['organization'];
  role: string;
  memberSince: string;
  operations: {
    sourceLabel: string;
    generatedAt: string;
    summary: {
      activeProjects: number;
      activeWorkforce: number | null;
      budgetUtilization: string | null;
      healthyProjects: number;
      atRiskProjects: number;
      safetyAlerts: number;
      maintenanceAlerts: number;
    };
    projects: {
      id: string;
      code: string;
      name: string;
      city: string;
      state: string;
      status: string;
      startDate: string;
      endDate: string;
      progress: number;
      overdue: number;
      riskScore: number;
      manager: string | null;
      budgetUtilization: string | null;
      milestones: {
        id: string;
        name: string;
        plannedDate: string;
        status: string;
        progress: number;
      }[];
    }[];
    analytics: {
      statusDistribution: { label: string; value: number }[];
      projectPerformance: { label: string; progress: number; risk: number }[];
      progressTrend: { date: string; progress: number; observations: number }[];
    };
    activity: {
      id: string;
      action: string;
      actor: string;
      projectId: string;
      projectName: string;
      createdAt: string;
    }[];
    maintenanceAlerts: {
      id: string;
      equipment: string;
      type: string;
      priority: string;
      status: string;
      scheduledAt: string;
    }[];
  };
}
export function roleLabel(role: string) {
  return role
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
export function errorMessage(error: unknown): string {
  const value = error as {
    status?: number;
    error?: { message?: string; errors?: { message: string }[] };
  };
  if (value.status === 0)
    return 'We could not reach BuildTrack. Check your connection and try again.';
  return (
    value.error?.errors?.[0]?.message ||
    value.error?.message ||
    'Something went wrong. Please try again.'
  );
}

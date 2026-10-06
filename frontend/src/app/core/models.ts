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

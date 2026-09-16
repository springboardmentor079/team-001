export type Role =
  | 'admin'
  | 'project_manager'
  | 'site_engineer'
  | 'contractor'
  | 'worker'
  | 'client';

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: Role;
  is_active: boolean;
}

export interface SignupRequest {
  full_name: string;
  email: string;
  password: string;
  role: Role;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

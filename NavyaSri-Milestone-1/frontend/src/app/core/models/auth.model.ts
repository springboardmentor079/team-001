import { User, UserRole } from './user.model';

export interface RegisterPayload {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
  role: UserRole;
  phone_number?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
  reset_token?: string | null;
  expires_in_minutes?: number | null;
}

export interface ResetPasswordPayload {
  token: string;
  new_password: string;
  confirm_new_password: string;
}

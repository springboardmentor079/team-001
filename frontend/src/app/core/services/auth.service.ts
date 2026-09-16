import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  LoginRequest,
  SignupRequest,
  User,
} from '../models/user.model';

const TOKEN_KEY = 'buildtrack_token';
const USER_KEY = 'buildtrack_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  /** Reactive signal so components can react to login/logout instantly */
  currentUser = signal<User | null>(this.readStoredUser());

  constructor(private http: HttpClient) {}

  signup(payload: SignupRequest): Observable<User> {
    return this.http.post<User>(`${environment.apiUrl}/auth/signup`, payload);
  }

  login(payload: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, payload)
      .pipe(
        tap((res) => {
          localStorage.setItem(TOKEN_KEY, res.access_token);
          localStorage.setItem(USER_KEY, JSON.stringify(res.user));
          this.currentUser.set(res.user);
        })
      );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUser.set(null);
  }

  forgotPassword(email: string): Observable<{ message: string; reset_token: string }> {
    return this.http.post<{ message: string; reset_token: string }>(
      `${environment.apiUrl}/auth/forgot-password`,
      { email }
    );
  }

  resetPassword(resetToken: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${environment.apiUrl}/auth/reset-password`,
      { reset_token: resetToken, new_password: newPassword }
    );
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  hasRole(...roles: string[]): boolean {
    const user = this.currentUser();
    return !!user && roles.includes(user.role);
  }

  private readStoredUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  }
}

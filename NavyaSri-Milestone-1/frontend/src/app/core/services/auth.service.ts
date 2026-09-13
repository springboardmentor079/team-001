import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import {
  ForgotPasswordPayload,
  ForgotPasswordResponse,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  TokenResponse,
} from '../models/auth.model';
import { ROLE_DASHBOARD_ROUTE, User } from '../models/user.model';
import { ApiService } from './api.service';

const TOKEN_KEY = 'buildtrack_access_token';
const USER_KEY = 'buildtrack_current_user';

/**
 * Owns the authentication session: login/register/logout, JWT + user
 * persistence in localStorage (so a page refresh doesn't lose the
 * session), and exposes the current user as an observable for the rest
 * of the app to react to.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);

  private currentUserSubject = new BehaviorSubject<User | null>(this.readStoredUser());
  readonly currentUser$ = this.currentUserSubject.asObservable();

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  get isAuthenticated(): boolean {
    return !!this.token && !!this.currentUser;
  }

  register(payload: RegisterPayload): Observable<User> {
    return this.api.post<User>('/auth/register', payload);
  }

  login(payload: LoginPayload): Observable<TokenResponse> {
    return this.api.post<TokenResponse>('/auth/login', payload).pipe(
      tap((res) => this.setSession(res)),
    );
  }

  forgotPassword(payload: ForgotPasswordPayload): Observable<ForgotPasswordResponse> {
    return this.api.post<ForgotPasswordResponse>('/auth/forgot-password', payload);
  }

  resetPassword(payload: ResetPasswordPayload): Observable<User> {
    return this.api.post<User>('/auth/reset-password', payload);
  }

  fetchCurrentUser(): Observable<User> {
    return this.api.get<User>('/auth/me').pipe(
      tap((user) => this.persistUser(user)),
    );
  }

  logout(navigate: boolean = true): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUserSubject.next(null);
    if (navigate) {
      this.router.navigate(['/auth/login']);
    }
  }

  /** Route the user to the dashboard matching their role. */
  redirectToDashboard(): void {
    const user = this.currentUser;
    const route = user ? ROLE_DASHBOARD_ROUTE[user.role] : '/auth/login';
    this.router.navigateByUrl(route);
  }

  private setSession(tokenResponse: TokenResponse): void {
    localStorage.setItem(TOKEN_KEY, tokenResponse.access_token);
    this.persistUser(tokenResponse.user);
  }

  private persistUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private readStoredUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }
}

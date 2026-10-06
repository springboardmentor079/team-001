import { Injectable, inject, signal } from '@angular/core';
import { HttpBackend, HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import {
  Observable,
  of,
  catchError,
  finalize,
  map,
  shareReplay,
  tap,
  switchMap,
  throwError,
} from 'rxjs';
import { ApiResponse, Session, User } from './models';
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = new HttpClient(inject(HttpBackend));
  private base = '/api/v1/auth';
  readonly user = signal<User | null>(null);
  private access = '';
  private pending: Observable<boolean> | null = null;
  private attempted = false;
  token() {
    return this.access;
  }
  private session(value: Session) {
    this.access = value.accessToken;
    this.user.set(value.user);
    this.attempted = true;
  }
  clear() {
    this.access = '';
    this.user.set(null);
    this.attempted = true;
  }
  private headers() {
    return new HttpHeaders({ Authorization: `Bearer ${this.access}` });
  }
  private protectedRequest<T>(method: string, url: string, body: unknown) {
    const send = () =>
      this.http.request<ApiResponse<T>>(method, url, { body, headers: this.headers() });
    return send().pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status !== 401) return throwError(() => error);
        return this.refresh().pipe(switchMap((ok) => (ok ? send() : throwError(() => error))));
      }),
    );
  }
  login(data: { email: string; password: string; remember: boolean }) {
    return this.http
      .post<ApiResponse<Session>>(`${this.base}/login`, data, { withCredentials: true })
      .pipe(tap((r) => this.session(r.data)));
  }
  register(data: {
    name: string;
    email: string;
    phone: string;
    company: string;
    password: string;
  }) {
    return this.http.post<ApiResponse<User>>(`${this.base}/register`, data);
  }
  forgot(email: string) {
    return this.http.post<ApiResponse<null>>(`${this.base}/forgot-password`, { email });
  }
  reset(token: string, password: string) {
    return this.http
      .post<ApiResponse<null>>(`${this.base}/reset-password`, { token, password })
      .pipe(tap(() => this.clear()));
  }
  restore(): Observable<boolean> {
    if (this.user()) return of(true);
    if (this.attempted) return of(false);
    return this.refresh();
  }
  refresh(): Observable<boolean> {
    if (this.pending) return this.pending;
    this.pending = this.http
      .post<ApiResponse<Session>>(
        `${this.base}/refresh`,
        {},
        { withCredentials: true, headers: { 'X-BuildTrack-Client': 'web' } },
      )
      .pipe(
        tap((r) => this.session(r.data)),
        map(() => true),
        catchError(() => {
          this.clear();
          return of(false);
        }),
        finalize(() => (this.pending = null)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    return this.pending;
  }
  logout() {
    return this.http
      .post<ApiResponse<null>>(
        `${this.base}/logout`,
        {},
        { withCredentials: true, headers: { 'X-BuildTrack-Client': 'web' } },
      )
      .pipe(tap(() => this.clear()));
  }
  updateProfile(data: { name: string; phone: string }) {
    return this.protectedRequest<User>('PATCH', `${this.base}/me`, data).pipe(
      tap((r) => this.user.set(r.data)),
    );
  }
  changePassword(currentPassword: string, password: string) {
    return this.protectedRequest<null>('POST', `${this.base}/change-password`, {
      currentPassword,
      password,
    }).pipe(tap(() => this.clear()));
  }
}

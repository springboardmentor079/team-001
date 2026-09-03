import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

export interface Signup { full_name: string; email: string; password: string; }
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly key = 'buildtrack_token';
  readonly loggedIn = signal(!!localStorage.getItem(this.key));
  constructor(private http: HttpClient) {}
  login(email: string, password: string) { return this.http.post<{access_token: string}>('/api/auth/login', {email, password}).pipe(tap(r => { localStorage.setItem(this.key, r.access_token); this.loggedIn.set(true); })); }
  signup(data: Signup) { return this.http.post('/api/auth/signup', data); }
  requestReset(email: string) { return this.http.post<{message: string}>('/api/auth/password-reset/request', {email}); }
  token() { return localStorage.getItem(this.key); }
  logout() { localStorage.removeItem(this.key); this.loggedIn.set(false); }
}

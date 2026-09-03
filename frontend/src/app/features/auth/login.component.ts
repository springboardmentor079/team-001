import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../core/auth.service';
@Component({imports: [FormsModule, RouterLink, MatButtonModule, MatFormFieldModule, MatInputModule], template: `<main class="auth-page"><section class="auth-card"><h1>BuildTrack</h1><h2>Sign in</h2><form (ngSubmit)="submit()"><mat-form-field class="form-field"><mat-label>Email</mat-label><input matInput type="email" name="email" [(ngModel)]="email" required></mat-form-field><mat-form-field class="form-field"><mat-label>Password</mat-label><input matInput type="password" name="password" [(ngModel)]="password" required></mat-form-field>@if (message) {<p class="success">{{message}}</p>} @if (error) {<p class="error">{{error}}</p>}<button mat-flat-button color="primary" type="submit" [disabled]="loading">{{loading ? 'Signing in…' : 'Sign in'}}</button></form><p>Need an account? <a routerLink="/signup">Sign up</a></p></section></main>`})
export class LoginComponent { email = ''; password = ''; error = ''; message = ''; loading = false; constructor(private auth: AuthService) {} submit() { this.error=''; this.message=''; this.loading=true; this.auth.login(this.email, this.password).subscribe({next: () => { this.message='Signed in successfully. Your session token is stored locally for API testing.'; this.loading=false; }, error: e => {this.error=e.error?.detail || 'Unable to sign in.'; this.loading=false;}}); } }

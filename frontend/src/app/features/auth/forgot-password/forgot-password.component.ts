import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './forgot-password.component.html',
})
export class ForgotPasswordComponent {
  loading = signal(false);
  errorMessage = signal<string | null>(null);
  infoMessage = signal<string | null>(null);

  form: any;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.errorMessage.set(null);

    const email = this.form.getRawValue().email as string;

    this.authService.forgotPassword(email).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.email_sent || !res.reset_token) {
          // Production behaviour: the link was emailed, nothing else to do here.
          this.infoMessage.set('If that email is registered, a reset link has been sent. Please check your inbox.');
          return;
        }
        // Development behaviour (no SMTP configured): continue straight to the reset page.
        this.infoMessage.set('Email service is not configured (development mode). Redirecting you to reset your password...');
        const token = res.reset_token;
        setTimeout(() => {
          this.router.navigate(['/reset-password'], { queryParams: { token } });
        }, 1500);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.detail || 'Something went wrong.');
      },
    });
  }
}

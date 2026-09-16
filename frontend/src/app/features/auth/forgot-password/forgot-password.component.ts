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
        // In production, this token is emailed to the user rather than
        // shown here — displayed only so the reset flow can be demoed
        // without an SMTP/email service configured.
        this.infoMessage.set(
          'A reset link has been generated. Redirecting you to reset your password...'
        );
        setTimeout(() => {
          this.router.navigate(['/reset-password'], {
            queryParams: { token: res.reset_token },
          });
        }, 1500);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.detail || 'Something went wrong.');
      },
    });
  }
}

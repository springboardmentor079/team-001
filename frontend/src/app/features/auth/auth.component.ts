import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { IconComponent } from '../../core/icon.component';
import { errorMessage } from '../../core/models';

@Component({
  selector: 'bt-auth',
  imports: [ReactiveFormsModule, RouterLink, IconComponent],
  templateUrl: './auth.component.html',
})
export class AuthComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  readonly mode = this.route.snapshot.data['mode'] as string;
  readonly help = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  readonly visible = signal(false);
  readonly form = this.fb.nonNullable.group({
    name: [''],
    company: [''],
    phone: [''],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    confirm: [''],
    remember: [false],
  });
  constructor() {
    if (this.mode === 'register') {
      this.form.controls.name.addValidators([Validators.required, Validators.minLength(2)]);
      this.form.controls.company.addValidators([Validators.required, Validators.minLength(2)]);
    }
    if (this.mode === 'login') this.form.controls.password.addValidators(Validators.required);
    if (this.mode === 'register' || this.mode === 'reset-password') {
      this.form.controls.password.addValidators([
        Validators.required,
        Validators.minLength(12),
        Validators.maxLength(72),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/),
      ]);
      this.form.controls.confirm.addValidators(Validators.required);
    }
    if (this.mode === 'reset-password') this.form.controls.email.clearValidators();
    for (const control of Object.values(this.form.controls)) control.updateValueAndValidity();
    if (this.mode === 'login')
      this.auth.restore().subscribe((ok) => {
        if (ok) void this.router.navigateByUrl('/workspace');
      });
  }
  get title() {
    return {
      login: 'Welcome back.',
      register: 'Build something great.',
      'forgot-password': 'Forgot your password?',
      'reset-password': 'A fresh start.',
    }[this.mode];
  }
  get subtitle() {
    return {
      login: 'Sign in to your BuildTrack workspace.',
      register: 'Create your account and join a better way to build.',
      'forgot-password': 'Enter your email and we’ll send you a reset link.',
      'reset-password': 'Choose a strong password to secure your account.',
    }[this.mode];
  }
  get action() {
    return {
      login: 'Sign in',
      register: 'Create account',
      'forgot-password': 'Send reset link',
      'reset-password': 'Update password',
    }[this.mode];
  }
  invalid(name: keyof typeof this.form.controls) {
    const c = this.form.controls[name];
    return c.touched && c.invalid;
  }
  submit() {
    this.error.set('');
    this.message.set('');
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.error.set('Please check the form and try again.');
      return;
    }
    const value = this.form.getRawValue();
    if (
      (this.mode === 'register' || this.mode === 'reset-password') &&
      value.password !== value.confirm
    ) {
      this.error.set('Your passwords do not match.');
      return;
    }
    this.busy.set(true);
    const done = () => this.busy.set(false);
    const fail = (e: unknown) => this.error.set(errorMessage(e));
    if (this.mode === 'login') {
      this.auth
        .login({ email: value.email, password: value.password, remember: value.remember })
        .pipe(finalize(done))
        .subscribe({
          next: () => {
            const target = this.route.snapshot.queryParamMap.get('returnUrl');
            void this.router.navigateByUrl(
              target?.startsWith('/') && !target.startsWith('//') ? target : '/workspace',
            );
          },
          error: fail,
        });
    } else if (this.mode === 'register') {
      this.auth
        .register({
          name: value.name,
          company: value.company,
          phone: value.phone,
          email: value.email,
          password: value.password,
        })
        .pipe(finalize(done))
        .subscribe({
          next: () => {
            this.message.set('Your account is ready. Sign in to continue.');
            this.form.reset();
          },
          error: fail,
        });
    } else if (this.mode === 'forgot-password') {
      this.auth
        .forgot(value.email)
        .pipe(finalize(done))
        .subscribe({ next: (r) => this.message.set(r.message), error: fail });
    } else {
      const token = this.route.snapshot.queryParamMap.get('token') || '';
      this.auth
        .reset(token, value.password)
        .pipe(finalize(done))
        .subscribe({ next: (r) => this.message.set(r.message), error: fail });
    }
  }
}

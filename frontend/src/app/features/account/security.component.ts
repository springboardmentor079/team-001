import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { IconComponent } from '../../core/icon.component';
import { errorMessage } from '../../core/models';
@Component({
  selector: 'bt-security',
  imports: [ReactiveFormsModule, IconComponent, RouterLink],
  template: ` <div class="page-heading">
      <div>
        <span class="eyebrow dark">MY ACCOUNT</span>
        <h1>Security<span class="orange">.</span></h1>
        <p>A safer workspace starts with your account.</p>
      </div>
    </div>
    @if (auth.user()?.mustChangePassword) {
      <div class="notice warning" role="alert">
        Change the temporary password before entering the workspace.
      </div>
    }
    <div class="settings-grid">
      <section class="panel settings-form">
        <div class="panel-heading">
          <div>
            <h2>Change password</h2>
            <p>Updating your password signs you out of all devices.</p>
          </div>
          <bt-icon name="lock" />
        </div>
        @if (error()) {
          <div class="notice error" role="alert">{{ error() }}</div>
        }
        <form [formGroup]="form" (ngSubmit)="save()">
          <div class="field">
            <label for="current">Current password</label
            ><input
              id="current"
              type="password"
              formControlName="currentPassword"
              autocomplete="current-password"
            />
          </div>
          <div class="field">
            <label for="new">New password</label
            ><input
              id="new"
              type="password"
              formControlName="password"
              autocomplete="new-password"
            /><small class="field-help"
              >12–72 characters, including uppercase, lowercase, and a number.</small
            >
          </div>
          <div class="field">
            <label for="repeat">Confirm new password</label
            ><input
              id="repeat"
              type="password"
              formControlName="confirm"
              autocomplete="new-password"
            />
          </div>
          <button class="btn primary" [disabled]="busy()">
            {{ busy() ? 'Updating…' : 'Update password' }}<bt-icon name="arrow" />
          </button>
        </form>
      </section>
      <aside class="panel security-tips">
        <span class="icon-tile green-tile"><bt-icon name="shield" /></span>
        <h2>A few good habits</h2>
        <ul>
          <li>Use a password you haven’t used elsewhere.</li>
          <li>Keep your sign-in details private.</li>
          <li>Sign out when using a shared device.</li>
        </ul>
        <a routerLink="/forgot-password">Forgot your current password? →</a>
      </aside>
    </div>`,
})
export class SecurityComponent {
  readonly auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly form = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(12),
        Validators.maxLength(72),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/),
      ],
    ],
    confirm: ['', Validators.required],
  });
  save() {
    this.error.set('');
    const v = this.form.getRawValue();
    if (this.form.invalid || v.password !== v.confirm) {
      this.error.set('Check your password requirements and make sure both passwords match.');
      return;
    }
    this.busy.set(true);
    this.auth
      .changePassword(v.currentPassword, v.password)
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: () => void this.router.navigateByUrl('/login'),
        error: (e) => this.error.set(errorMessage(e)),
      });
  }
}

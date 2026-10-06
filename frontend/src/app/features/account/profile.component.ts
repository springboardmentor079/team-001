import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { IconComponent } from '../../core/icon.component';
import { errorMessage, roleLabel } from '../../core/models';
@Component({
  selector: 'bt-profile',
  imports: [ReactiveFormsModule, IconComponent],
  template: ` <div class="page-heading">
      <div>
        <span class="eyebrow dark">MY ACCOUNT</span>
        <h1>My profile<span class="orange">.</span></h1>
        <p>The details that help your team know you.</p>
      </div>
    </div>
    <div class="settings-grid">
      <section class="panel settings-form">
        <div class="panel-heading">
          <div>
            <h2>Personal information</h2>
            <p>Update your name and contact number.</p>
          </div>
          <bt-icon name="user" />
        </div>
        @if (error()) {
          <div class="notice error" role="alert">{{ error() }}</div>
        }
        @if (message()) {
          <div class="notice success" role="status">{{ message() }}</div>
        }
        <form [formGroup]="form" (ngSubmit)="save()">
          <div class="field">
            <label for="profile-name">Full name</label
            ><input id="profile-name" formControlName="name" autocomplete="name" />
          </div>
          <div class="field">
            <label for="profile-phone">Phone number</label
            ><input
              id="profile-phone"
              formControlName="phone"
              autocomplete="tel"
              placeholder="+91"
            />
          </div>
          <div class="field">
            <label for="profile-email">Email address</label
            ><input id="profile-email" [value]="auth.user()?.email" disabled /><small
              class="field-help"
              >Contact your administrator to change your account email.</small
            >
          </div>
          <button class="btn primary" [disabled]="busy()">
            {{ busy() ? 'Saving…' : 'Save changes' }}<bt-icon name="check" />
          </button>
        </form>
      </section>
      <aside class="panel account-summary">
        <span class="large-avatar">{{ auth.user()?.name?.charAt(0) }}</span>
        <h2>{{ auth.user()?.name }}</h2>
        <span class="tag orange-tag">{{ label(auth.user()?.role || '') }}</span>
        <p>{{ auth.user()?.organization?.name }}</p>
        <div class="summary-note">
          <bt-icon name="shield" />
          <p>Your role and workspace access are managed by your administrator.</p>
        </div>
      </aside>
    </div>`,
})
export class ProfileComponent {
  readonly auth = inject(AuthService);
  private fb = inject(FormBuilder);
  readonly label = roleLabel;
  readonly busy = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  readonly form = this.fb.nonNullable.group({
    name: [
      this.auth.user()?.name || '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(150)],
    ],
    phone: [
      this.auth.user()?.phone || '',
      [Validators.maxLength(30), Validators.pattern(/^[+\d ()-]*$/)],
    ],
  });
  save() {
    this.error.set('');
    this.message.set('');
    if (this.form.invalid) {
      this.error.set('Enter a valid name and phone number.');
      return;
    }
    this.busy.set(true);
    this.auth
      .updateProfile(this.form.getRawValue())
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: () => this.message.set('Your profile has been updated.'),
        error: (e) => this.error.set(errorMessage(e)),
      });
  }
}

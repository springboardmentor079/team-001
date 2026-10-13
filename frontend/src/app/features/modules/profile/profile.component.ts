import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  project_manager: 'Project Manager',
  site_engineer: 'Site Engineer',
  contractor: 'Contractor',
  worker: 'Worker',
  client: 'Client',
};

const ROLE_ACCESS: Record<string, string[]> = {
  admin: ['Full system access', 'User management', 'All projects', 'All reports'],
  project_manager: ['Own projects', 'Workforce & resources', 'Procurement', 'Reports'],
  site_engineer: ['Site progress', 'Milestones', 'Machinery on site'],
  contractor: ['Assigned workers', 'Material requests'],
  worker: ['Own attendance', 'Assigned tasks'],
  client: ['Own project progress', 'Project reports'],
};

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent {
  nameMessage = signal<string | null>(null);
  nameError = signal<string | null>(null);
  pwMessage = signal<string | null>(null);
  pwError = signal<string | null>(null);
  nameForm: any;
  pwForm: any;

  constructor(public authService: AuthService, private fb: FormBuilder) {
    this.nameForm = this.fb.group({
      full_name: [this.authService.currentUser()?.full_name ?? '', [Validators.required, Validators.minLength(2)]],
    });
    this.pwForm = this.fb.group({
      current_password: ['', [Validators.required]],
      new_password: ['', [Validators.required, Validators.minLength(6)]],
      confirm: ['', [Validators.required]],
    });
  }

  saveName(): void {
    if (this.nameForm.invalid) return;
    this.nameMessage.set(null);
    this.nameError.set(null);
    this.authService.updateProfile(this.nameForm.getRawValue().full_name).subscribe({
      next: () => this.nameMessage.set('Name updated.'),
      error: (err) => this.nameError.set(err?.error?.detail?.[0]?.msg || err?.error?.detail || 'Could not update name.'),
    });
  }

  savePassword(): void {
    this.pwMessage.set(null);
    this.pwError.set(null);
    if (this.pwForm.invalid) {
      this.pwForm.markAllAsTouched();
      return;
    }
    const v = this.pwForm.getRawValue();
    if (v.new_password !== v.confirm) {
      this.pwError.set('New passwords do not match.');
      return;
    }
    this.authService.changePassword(v.current_password, v.new_password).subscribe({
      next: () => {
        this.pwMessage.set('Password changed successfully.');
        this.pwForm.reset({ current_password: '', new_password: '', confirm: '' });
      },
      error: (err) => this.pwError.set(err?.error?.detail?.[0]?.msg || err?.error?.detail || 'Could not change password.'),
    });
  }

  user = computed(() => this.authService.currentUser());

  roleLabel = computed(() => {
    const role = this.user()?.role || '';
    return ROLE_LABELS[role] || role;
  });

  accessList = computed(() => {
    const role = this.user()?.role || 'worker';
    return ROLE_ACCESS[role] || [];
  });

  initials = computed(() => {
    const name = this.user()?.full_name || '';
    return name
      .split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  });
}

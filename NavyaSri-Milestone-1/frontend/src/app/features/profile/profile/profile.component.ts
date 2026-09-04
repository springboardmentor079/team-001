import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { ROLE_LABELS, User } from '../../../core/models/user.model';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

/** View and edit the current user's own profile (name, phone, avatar URL). */
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    LoadingComponent,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  readonly roleLabels = ROLE_LABELS;

  isLoading = signal(true);
  isSaving = signal(false);
  profile = signal<User | null>(null);

  form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    phoneNumber: [''],
    profileImage: [''],
  });

  get f() {
    return this.form.controls;
  }

  get initials(): string {
    const name = this.profile()?.full_name;
    if (!name) return '?';
    return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  }

  ngOnInit(): void {
    this.userService.getMyProfile().subscribe({
      next: (user) => {
        this.profile.set(user);
        this.form.patchValue({
          fullName: user.full_name,
          phoneNumber: user.phone_number ?? '',
          profileImage: user.profile_image ?? '',
        });
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const raw = this.form.getRawValue();

    this.userService
      .updateMyProfile({
        full_name: raw.fullName,
        phone_number: raw.phoneNumber || undefined,
        profile_image: raw.profileImage || undefined,
      })
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (updated) => {
          this.profile.set(updated);
          this.snackBar.open('Profile updated successfully.', 'Close', {
            duration: 3000,
            panelClass: 'bt-snack-success',
          });
          // Refresh the cached user so the navbar/sidebar reflect the change.
          this.authService.fetchCurrentUser().subscribe();
        },
        error: (err: HttpErrorResponse) => {
          this.snackBar.open(err.error?.message ?? 'Could not update profile.', 'Close', { duration: 3500 });
        },
      });
  }
}

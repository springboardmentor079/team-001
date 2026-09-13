import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule, MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { UserService } from '../../../core/services/user.service';
import { ROLE_LABELS, User, UserRole } from '../../../core/models/user.model';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

/**
 * Administrator-only user management screen: list, filter by role, search
 * by name/email, and activate/deactivate accounts. Backed by the fully
 * implemented Milestone 1 admin user-management API.
 */
@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatChipsModule,
    MatButtonModule,
    MatSlideToggleModule,
    LoadingComponent,
  ],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.scss',
})
export class UsersListComponent implements OnInit {
  private userService = inject(UserService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  readonly roleLabels: Record<UserRole, string> = ROLE_LABELS;
  readonly roles = Object.values(UserRole);
  readonly displayedColumns = ['full_name', 'email', 'role', 'phone_number', 'is_active', 'created_at', 'actions'];

  isLoading = signal(true);
  users = signal<User[]>([]);
  total = signal(0);

  filterForm = this.fb.nonNullable.group({
    search: [''],
    role: [''],
  });

  ngOnInit(): void {
    this.loadUsers();

    this.filterForm.valueChanges.pipe(debounceTime(350), distinctUntilChanged()).subscribe(() => {
      this.loadUsers();
    });
  }

  loadUsers(): void {
    this.isLoading.set(true);
    const { search, role } = this.filterForm.getRawValue();

    this.userService.listUsers({ search: search || undefined, role: role || undefined }).subscribe({
      next: (res) => {
        this.users.set(res.items);
        this.total.set(res.total);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  onToggleActive(user: User, event: MatSlideToggleChange): void {
    const nextState = event.checked;
    this.userService.setUserActiveStatus(user.id, nextState).subscribe({
      next: (updated) => {
        this.users.update((list) => list.map((u) => (u.id === updated.id ? updated : u)));
        this.snackBar.open(
          `${updated.full_name} ${nextState ? 'activated' : 'deactivated'} successfully.`,
          'Close',
          { duration: 3000, panelClass: 'bt-snack-success' },
        );
      },
      error: () => {
        event.source.checked = !nextState;
        this.snackBar.open('Could not update user status. Please try again.', 'Close', { duration: 3000 });
      },
    });
  }
}

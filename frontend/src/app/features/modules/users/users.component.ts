import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './users.component.html',
})
export class UsersComponent implements OnInit {
  users = signal<User[]>([]);
  errorMessage = signal<string | null>(null);
  roles = ['admin', 'project_manager', 'site_engineer', 'contractor', 'worker', 'client'];

  constructor(private userService: UserService, public authService: AuthService) {}

  ngOnInit(): void {
    this.fetch();
  }

  isSelf(u: User): boolean {
    return u.id === this.authService.currentUser()?.id;
  }

  fetch(): void {
    this.userService.listAll().subscribe((u) => this.users.set(u));
  }

  changeRole(u: User, role: string): void {
    this.errorMessage.set(null);
    this.userService.update(u.id, { role }).subscribe({
      next: () => this.fetch(),
      error: (err) => {
        this.errorMessage.set(err?.error?.detail || 'Could not change role.');
        this.fetch();
      },
    });
  }

  toggleActive(u: User): void {
    this.errorMessage.set(null);
    this.userService.update(u.id, { is_active: !u.is_active }).subscribe({
      next: () => this.fetch(),
      error: (err) => this.errorMessage.set(err?.error?.detail || 'Could not update user.'),
    });
  }
}

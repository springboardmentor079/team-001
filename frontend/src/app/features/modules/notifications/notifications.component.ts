import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { NotificationService } from '../../../core/services/notification.service';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { DirectoryUser, NotificationItem } from '../../../core/models/domain.model';

const TYPE_ICONS: Record<string, string> = {
  project_update: 'business',
  task_assignment: 'assignment',
  procurement_alert: 'shopping_cart',
  attendance_alert: 'event_busy',
  deadline: 'schedule',
  system: 'info',
};

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
  ],
  templateUrl: './notifications.component.html',
})
export class NotificationsComponent implements OnInit {
  notifications = signal<NotificationItem[]>([]);
  directory = signal<DirectoryUser[]>([]);
  filter = signal<'all' | 'unread'>('all');
  info = signal<string | null>(null);
  error = signal<string | null>(null);

  types = ['system', 'project_update', 'task_assignment', 'procurement_alert', 'attendance_alert', 'deadline'];
  form: any;

  constructor(
    private fb: FormBuilder,
    private notificationService: NotificationService,
    private userService: UserService,
    public authService: AuthService
  ) {
    this.form = this.fb.group({
      user_id: [null, [Validators.required]],
      title: ['', [Validators.required, Validators.minLength(2)]],
      message: [''],
      type: ['system', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.fetch();
    if (this.canSend) this.userService.directory().subscribe((d) => this.directory.set(d));
  }

  get canSend(): boolean {
    return this.authService.hasRole('admin', 'project_manager');
  }

  icon(type: string): string {
    return TYPE_ICONS[type] ?? 'notifications';
  }

  visible(): NotificationItem[] {
    return this.filter() === 'unread' ? this.notifications().filter((n) => !n.is_read) : this.notifications();
  }

  unreadCount(): number {
    return this.notifications().filter((n) => !n.is_read).length;
  }

  fetch(): void {
    this.notificationService.list().subscribe((data) => this.notifications.set(data));
    this.notificationService.refreshUnread();
  }

  markRead(id: number): void {
    this.notificationService.markRead(id).subscribe(() => this.fetch());
  }

  markAll(): void {
    this.notificationService.markAllRead().subscribe(() => this.fetch());
  }

  runAlertCheck(): void {
    this.info.set(null);
    this.error.set(null);
    this.notificationService.generateAlerts().subscribe({
      next: (r) => {
        this.info.set(`Alert check done: ${r.deadline_alerts} deadline alert(s), ${r.low_stock_alerts} low-stock alert(s) created.`);
        this.fetch();
      },
      error: (err) => this.error.set(err?.error?.detail || 'Alert check failed.'),
    });
  }

  send(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.info.set(null);
    this.error.set(null);
    const v = this.form.getRawValue();
    this.notificationService.create({ ...v, user_id: Number(v.user_id) }).subscribe({
      next: () => {
        this.info.set('Notification sent.');
        this.form.patchValue({ title: '', message: '' });
        this.form.markAsUntouched();
        this.fetch();
      },
      error: (err) => this.error.set(err?.error?.detail || 'Could not send notification.'),
    });
  }
}

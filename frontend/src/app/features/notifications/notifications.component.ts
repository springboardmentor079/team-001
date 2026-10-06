import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { ApiResponse, errorMessage } from '../../core/models';
interface NotificationRecord { id: string; type: string; title: string; message: string; readAt: string | null; createdAt: string }
@Component({ selector: 'bt-notifications', imports: [DatePipe], templateUrl: './notifications.component.html' })
export class NotificationsComponent {
  private http = inject(HttpClient); readonly records = signal<NotificationRecord[]>([]); readonly unread = signal(0); readonly error = signal('');
  constructor() { this.load(); }
  load() { this.http.get<ApiResponse<{ records: NotificationRecord[]; unread: number }>>('/api/v1/notifications').subscribe({ next: (r) => { this.records.set(r.data.records); this.unread.set(r.data.unread); }, error: (e) => this.error.set(errorMessage(e)) }); }
  read(row: NotificationRecord) { if (row.readAt) return; this.http.patch(`/api/v1/notifications/${row.id}/read`, {}).subscribe(() => this.load()); }
  readAll() { this.http.post('/api/v1/notifications/read-all', {}).subscribe(() => this.load()); }
}

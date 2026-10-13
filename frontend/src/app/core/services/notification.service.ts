import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NotificationItem } from '../models/domain.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private base = `${environment.apiUrl}/notifications`;

  /** Live unread count shown as a badge in the sidebar. */
  unread = signal(0);

  constructor(private http: HttpClient) {}

  list(): Observable<NotificationItem[]> {
    return this.http.get<NotificationItem[]>(`${this.base}/`);
  }

  refreshUnread(): void {
    this.http.get<{ unread: number }>(`${this.base}/unread-count`).subscribe({
      next: (r) => this.unread.set(r.unread),
      error: () => {},
    });
  }

  markRead(id: number): Observable<NotificationItem> {
    return this.http.patch<NotificationItem>(`${this.base}/${id}/read`, {}).pipe(tap(() => this.refreshUnread()));
  }

  markAllRead(): Observable<{ marked_read: number }> {
    return this.http.patch<{ marked_read: number }>(`${this.base}/read-all`, {}).pipe(tap(() => this.refreshUnread()));
  }

  create(payload: { user_id: number; title: string; message?: string; type: string }): Observable<NotificationItem> {
    return this.http.post<NotificationItem>(`${this.base}/`, payload);
  }

  generateAlerts(): Observable<{ deadline_alerts: number; low_stock_alerts: number }> {
    return this.http
      .post<{ deadline_alerts: number; low_stock_alerts: number }>(`${this.base}/generate-alerts`, {})
      .pipe(tap(() => this.refreshUnread()));
  }
}

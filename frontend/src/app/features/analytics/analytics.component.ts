import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { ApiResponse, errorMessage, roleLabel } from '../../core/models';
import { AuthService } from '../../core/auth.service';
interface Trend { date: string; progress: number; workers: number }
interface AnalyticsProject { id: string; code: string; name: string; status: string; progress: number; overdue: number; openDelays: number; criticalDelays: number; unresolvedInspections: number; approvedHours: string; budget: string; actual: string; commitment: string; forecast: string; budgetUtilization: string; riskScore: number; insight: string; trend: Trend[] }
interface AnalyticsData { projects: AnalyticsProject[]; summary: { projects: number; averageProgress: number; atRisk: number; overdueItems: number; lowStock: number | null; actual: string; forecast: string }; methodology: { progress: string; risk: string; finance: string } }
interface Weather { live: boolean; label: string; location: string; condition: string; temperatureC: number; rainChancePercent: number; note: string }
interface Cameras { live: boolean; label: string; note: string; feeds: unknown[] }
@Component({ selector: 'bt-analytics', imports: [DatePipe, DecimalPipe], templateUrl: './analytics.component.html' })
export class AnalyticsComponent {
  private http = inject(HttpClient); readonly auth = inject(AuthService); readonly label = roleLabel;
  readonly data = signal<AnalyticsData | null>(null); readonly selected = signal<AnalyticsProject | null>(null); readonly weather = signal<Weather | null>(null); readonly cameras = signal<Cameras | null>(null); readonly error = signal('');
  constructor() { this.http.get<ApiResponse<AnalyticsData>>('/api/v1/analytics').subscribe({ next: (r) => { this.data.set(r.data); if (r.data.projects[0]) this.inspect(r.data.projects[0]); }, error: (e) => this.error.set(errorMessage(e)) }); }
  inspect(project: AnalyticsProject) { this.selected.set(project); this.http.get<ApiResponse<Weather>>(`/api/v1/analytics/projects/${project.id}/weather`).subscribe((r) => this.weather.set(r.data)); this.http.get<ApiResponse<Cameras>>(`/api/v1/analytics/projects/${project.id}/camera-feeds`).subscribe((r) => this.cameras.set(r.data)); }
}

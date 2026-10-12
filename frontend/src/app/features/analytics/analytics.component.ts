import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiResponse, errorMessage, roleLabel } from '../../core/models';
import { AuthService } from '../../core/auth.service';
import { ChartSeries, DataChartComponent } from '../../shared/data-chart.component';

interface Trend {
  date: string;
  progress: number;
  workers: number;
}
interface AnalyticsProject {
  id: string;
  code: string;
  name: string;
  status: string;
  progress: number;
  overdue: number;
  openDelays: number;
  criticalDelays: number;
  unresolvedInspections: number;
  approvedHours: string;
  budget: string | null;
  actual: string | null;
  commitment: string | null;
  forecast: string | null;
  budgetUtilization: string | null;
  exposureUtilization: string | null;
  riskScore: number;
  insight: string;
  trend: Trend[];
}
interface Distribution {
  label: string;
  value: number;
}
interface AnalyticsData {
  generatedAt: string;
  reporting: {
    start: string;
    end: string;
    interval: 'week' | 'month';
    timezone: string;
    currency: string;
    projectId: string | null;
    status: string | null;
  };
  filters: { projects: { id: string; code: string; name: string }[] };
  projects: AnalyticsProject[];
  summary: {
    projects: number;
    activeProjects: number;
    completedProjects: number;
    averageProgress: number;
    atRisk: number;
    overdueItems: number;
    lowStock: number | null;
    budget: string | null;
    actual: string | null;
    remaining: string | null;
    commitment: string | null;
    budgetUtilization: number | null;
    resourceUtilization: number | null;
    pendingProcurement: number | null;
    overdueDeliveries: number | null;
  };
  charts: {
    budgetTrend: { date: string; actual: number; budget: number }[] | null;
    completionTrend: { date: string; progress: number | null; observations: number }[];
    workforceTrend: { date: string; workers: number; approvedHours: number }[];
    equipmentTrend: { date: string; utilization: number | null }[] | null;
    procurementTrend:
      { date: string; requests: number; ordered: number; spending: number }[] | null;
    projectPerformance: {
      id: string;
      label: string;
      status: string;
      progress: number;
      risk: number;
      budget: number | null;
      actual: number | null;
    }[];
    statusDistribution: Distribution[];
    equipmentDistribution: Distribution[] | null;
    procurementDistribution: Distribution[] | null;
    deliveryDistribution: Distribution[] | null;
  };
  insights: {
    severity: string;
    type: string;
    projectId: string | null;
    project: string | null;
    metric: string;
    message: string;
    source: string;
    asOf: string;
  }[];
  predictiveReadiness: {
    operationalPredictionsDisplayed: boolean;
    reason: string;
    location: string;
  };
  methodology: {
    progress: string;
    risk: string;
    finance: string;
    resources: string;
    procurement: string;
  };
}
interface Weather {
  live: boolean;
  label: string;
  location: string;
  condition: string;
  temperatureC: number;
  rainChancePercent: number;
  note: string;
}
interface Cameras {
  live: boolean;
  label: string;
  note: string;
  feeds: unknown[];
}

@Component({
  selector: 'bt-analytics',
  imports: [CurrencyPipe, DatePipe, DecimalPipe, RouterLink, DataChartComponent],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.scss',
})
export class AnalyticsComponent {
  private http = inject(HttpClient);
  readonly auth = inject(AuthService);
  readonly label = roleLabel;
  readonly data = signal<AnalyticsData | null>(null);
  readonly selected = signal<AnalyticsProject | null>(null);
  readonly weather = signal<Weather | null>(null);
  readonly cameras = signal<Cameras | null>(null);
  readonly error = signal('');
  readonly loading = signal(true);
  readonly availableProjects = signal<{ id: string; code: string; name: string }[]>([]);
  readonly filter = signal({ start: '', end: '', projectId: '', status: '', interval: 'month' });

  constructor() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set('');
    let params = new HttpParams();
    const filter = this.filter();
    for (const [key, value] of Object.entries(filter)) if (value) params = params.set(key, value);
    this.http.get<ApiResponse<AnalyticsData>>('/api/v1/analytics', { params }).subscribe({
      next: ({ data }) => {
        this.data.set(data);
        if (!this.availableProjects().length) this.availableProjects.set(data.filters.projects);
        this.filter.update((current) => ({
          ...current,
          start: data.reporting.start,
          end: data.reporting.end,
          interval: data.reporting.interval,
        }));
        const previous = this.selected();
        const selection =
          data.projects.find((project) => project.id === previous?.id) || data.projects[0] || null;
        this.selected.set(selection);
        this.loading.set(false);
        if (selection) this.loadProviders(selection.id);
      },
      error: (error) => {
        this.error.set(errorMessage(error));
        this.loading.set(false);
      },
    });
  }

  updateFilter(field: string, event: Event) {
    const value = (event.target as HTMLInputElement | HTMLSelectElement).value;
    this.filter.update((current) => ({ ...current, [field]: value }));
  }
  reset() {
    this.filter.set({ start: '', end: '', projectId: '', status: '', interval: 'month' });
    this.load();
  }
  inspect(project: AnalyticsProject) {
    this.selected.set(project);
    this.loadProviders(project.id);
  }
  private loadProviders(projectId: string) {
    this.http
      .get<ApiResponse<Weather>>(`/api/v1/analytics/projects/${projectId}/weather`)
      .subscribe((response) => this.weather.set(response.data));
    this.http
      .get<ApiResponse<Cameras>>(`/api/v1/analytics/projects/${projectId}/camera-feeds`)
      .subscribe((response) => this.cameras.set(response.data));
  }
  labels<T extends { date: string }>(rows: T[]) {
    return rows.map((row) => row.date);
  }
  values<T>(rows: T[], key: keyof T) {
    return rows.map((row) => (typeof row[key] === 'number' ? (row[key] as number) : null));
  }
  distributions(rows: Distribution[] | null): ChartSeries[] {
    return [{ name: 'Records', values: (rows || []).map((row) => row.value) }];
  }
  distributionLabels(rows: Distribution[]) {
    return rows.map((row) => this.label(row.label));
  }
  performanceLabels(rows: AnalyticsData['charts']['projectPerformance']) {
    return rows.map((row) => row.label);
  }
  performanceSeries(
    rows: AnalyticsData['charts']['projectPerformance'],
    type: 'schedule' | 'finance',
  ): ChartSeries[] {
    return type === 'schedule'
      ? [
          { name: 'Completion', values: rows.map((row) => row.progress) },
          { name: 'Rule risk', values: rows.map((row) => row.risk), color: '#D99128' },
        ]
      : [
          { name: 'Approved budget', values: rows.map((row) => row.budget), color: '#477BA8' },
          { name: 'Actual expenditure', values: rows.map((row) => row.actual), color: '#245C45' },
        ];
  }
  sortPerformance(field: 'progress' | 'risk' | 'actual') {
    const data = this.data();
    if (!data) return;
    data.charts.projectPerformance.sort((a, b) => (b[field] || 0) - (a[field] || 0));
    this.data.set({
      ...data,
      charts: { ...data.charts, projectPerformance: [...data.charts.projectPerformance] },
    });
  }
}

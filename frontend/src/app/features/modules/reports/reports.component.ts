import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ReportService, ExportFormat } from '../../../core/services/report.service';
import { AuthService } from '../../../core/services/auth.service';
import { Analytics, ReportHistoryItem, ReportSummary } from '../../../core/models/domain.model';
import { ChartComponent } from '../../../shared/chart/chart.component';
import { saveBlobResponse } from '../../../core/util/download';

interface ExportKind { key: string; label: string; icon: string; clientAllowed: boolean; }

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, MatIconModule, ChartComponent],
  templateUrl: './reports.component.html',
})
export class ReportsComponent implements OnInit {
  summary = signal<ReportSummary | null>(null);
  analytics = signal<Analytics | null>(null);
  history = signal<ReportHistoryItem[]>([]);
  errorMessage = signal<string | null>(null);
  exporting = signal<string | null>(null);

  kinds: ExportKind[] = [
    { key: 'projects', label: 'Project progress', icon: 'business', clientAllowed: true },
    { key: 'expenses', label: 'Budget & expenses', icon: 'account_balance_wallet', clientAllowed: true },
    { key: 'workers', label: 'Workforce', icon: 'groups', clientAllowed: false },
    { key: 'attendance', label: 'Attendance', icon: 'event_available', clientAllowed: false },
    { key: 'inventory', label: 'Inventory', icon: 'inventory_2', clientAllowed: false },
    { key: 'procurement', label: 'Procurement', icon: 'shopping_cart', clientAllowed: false },
    { key: 'resources', label: 'Resource utilisation', icon: 'precision_manufacturing', clientAllowed: false },
  ];
  formats: { key: ExportFormat; label: string }[] = [
    { key: 'pdf', label: 'PDF' },
    { key: 'xlsx', label: 'Excel' },
    { key: 'csv', label: 'CSV' },
  ];

  constructor(private reportService: ReportService, public authService: AuthService) {}

  ngOnInit(): void {
    this.reportService.getSummary().subscribe({
      next: (data) => this.summary.set(data),
      error: (err) => this.errorMessage.set(err?.error?.detail || 'Reports are only available to Admin, Project Manager and Client roles.'),
    });
    this.reportService.getAnalytics().subscribe((a) => this.analytics.set(a));
    this.loadHistory();
  }

  get isClient(): boolean {
    return this.authService.hasRole('client');
  }

  get canSeeHistory(): boolean {
    return this.authService.hasRole('admin', 'project_manager');
  }

  availableKinds(): ExportKind[] {
    return this.isClient ? this.kinds.filter((k) => k.clientAllowed) : this.kinds;
  }

  loadHistory(): void {
    if (this.canSeeHistory) this.reportService.history().subscribe((h) => this.history.set(h));
  }

  download(kind: string, format: ExportFormat): void {
    this.exporting.set(`${kind}-${format}`);
    this.errorMessage.set(null);
    this.reportService.export(kind, format).subscribe({
      next: (res) => {
        saveBlobResponse(res, `buildtrack-${kind}.${format}`);
        this.exporting.set(null);
        this.loadHistory();
      },
      error: () => {
        this.exporting.set(null);
        this.errorMessage.set('Export failed. You may not have permission for this report.');
      },
    });
  }

  keys(o: Record<string, number> | undefined): string[] {
    return Object.keys(o ?? {});
  }

  vals(o: Record<string, number> | undefined): number[] {
    return Object.values(o ?? {});
  }

  one(label: string, o: Record<string, number> | undefined) {
    return [{ label, data: this.vals(o) }];
  }

  budgetLabels(): string[] {
    return (this.analytics()?.budget_vs_spent ?? []).map((b) => b.project);
  }

  budgetSeries() {
    const rows = this.analytics()?.budget_vs_spent ?? [];
    return [
      { label: 'Budget', data: rows.map((r) => r.budget) },
      { label: 'Spent', data: rows.map((r) => r.spent) },
    ];
  }

  utilisation(): number {
    const s = this.summary();
    return s && s.total_budget > 0 ? Math.round((s.total_spent / s.total_budget) * 100) : 0;
  }
}

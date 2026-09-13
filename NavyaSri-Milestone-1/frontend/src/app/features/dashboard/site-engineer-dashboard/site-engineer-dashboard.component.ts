import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { DashboardService } from '../../../core/services/dashboard.service';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

interface SiteEngineerDashboardData {
  assigned_projects: number;
  pending_site_activities: number;
  pending_tasks: number;
  progress_overview_percentage: number;
}

@Component({
  selector: 'app-site-engineer-dashboard',
  standalone: true,
  imports: [CommonModule, StatCardComponent, LoadingComponent],
  templateUrl: './site-engineer-dashboard.component.html',
  styleUrl: './site-engineer-dashboard.component.scss',
})
export class SiteEngineerDashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  isLoading = signal(true);
  data = signal<SiteEngineerDashboardData | null>(null);

  ngOnInit(): void {
    this.dashboardService.getSiteEngineerDashboard().subscribe({
      next: (res) => {
        this.data.set(res as unknown as SiteEngineerDashboardData);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }
}

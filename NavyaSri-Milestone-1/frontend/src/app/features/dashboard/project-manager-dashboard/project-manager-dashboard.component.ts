import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DashboardService } from '../../../core/services/dashboard.service';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

interface ProjectManagerDashboardData {
  assigned_projects: number;
  active_projects: number;
  upcoming_milestones: number;
  overall_progress_percentage: number;
}

@Component({
  selector: 'app-project-manager-dashboard',
  standalone: true,
  imports: [CommonModule, MatProgressBarModule, StatCardComponent, LoadingComponent],
  templateUrl: './project-manager-dashboard.component.html',
  styleUrl: './project-manager-dashboard.component.scss',
})
export class ProjectManagerDashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  isLoading = signal(true);
  data = signal<ProjectManagerDashboardData | null>(null);

  ngOnInit(): void {
    this.dashboardService.getProjectManagerDashboard().subscribe({
      next: (res) => {
        this.data.set(res as unknown as ProjectManagerDashboardData);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }
}

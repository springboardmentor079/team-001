import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { DashboardService } from '../../../core/services/dashboard.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

interface WorkerDashboardData {
  assigned_project: string | null;
  todays_status: string;
  upcoming_work_items: number;
}

@Component({
  selector: 'app-worker-dashboard',
  standalone: true,
  imports: [CommonModule, LoadingComponent],
  templateUrl: './worker-dashboard.component.html',
  styleUrl: './worker-dashboard.component.scss',
})
export class WorkerDashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  isLoading = signal(true);
  data = signal<WorkerDashboardData | null>(null);

  ngOnInit(): void {
    this.dashboardService.getWorkerDashboard().subscribe({
      next: (res) => {
        this.data.set(res as unknown as WorkerDashboardData);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }
}

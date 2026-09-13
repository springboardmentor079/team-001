import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { DashboardService } from '../../../core/services/dashboard.service';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

interface ContractorDashboardData {
  assigned_work: number;
  project_progress_percentage: number;
  upcoming_deadlines: number;
}

@Component({
  selector: 'app-contractor-dashboard',
  standalone: true,
  imports: [CommonModule, StatCardComponent, LoadingComponent],
  templateUrl: './contractor-dashboard.component.html',
  styleUrl: './contractor-dashboard.component.scss',
})
export class ContractorDashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  isLoading = signal(true);
  data = signal<ContractorDashboardData | null>(null);

  ngOnInit(): void {
    this.dashboardService.getContractorDashboard().subscribe({
      next: (res) => {
        this.data.set(res as unknown as ContractorDashboardData);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }
}

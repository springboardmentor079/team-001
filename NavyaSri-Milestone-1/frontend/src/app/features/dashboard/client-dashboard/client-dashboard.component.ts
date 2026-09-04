import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { DashboardService } from '../../../core/services/dashboard.service';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

interface ClientDashboardData {
  my_projects: number;
  project_statuses: string[];
  progress_percentage: number;
}

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, MatChipsModule, StatCardComponent, LoadingComponent],
  templateUrl: './client-dashboard.component.html',
  styleUrl: './client-dashboard.component.scss',
})
export class ClientDashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  isLoading = signal(true);
  data = signal<ClientDashboardData | null>(null);

  ngOnInit(): void {
    this.dashboardService.getClientDashboard().subscribe({
      next: (res) => {
        this.data.set(res as unknown as ClientDashboardData);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }
}

import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { DashboardService } from '../../../core/services/dashboard.service';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ROLE_LABELS, UserRole } from '../../../core/models/user.model';

interface RecentUserRow {
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface AdminDashboardData {
  total_users: number;
  active_users: number;
  total_projects: number;
  active_projects: number;
  recent_users: RecentUserRow[];
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatChipsModule, StatCardComponent, LoadingComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  readonly roleLabels: Record<UserRole, string> = ROLE_LABELS;
  readonly displayedColumns = ['full_name', 'email', 'role', 'is_active', 'created_at'];

  isLoading = signal(true);
  data = signal<AdminDashboardData | null>(null);

  ngOnInit(): void {
    this.dashboardService.getAdminDashboard().subscribe({
      next: (res) => {
        this.data.set(res as unknown as AdminDashboardData);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }
}

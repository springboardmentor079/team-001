import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../../core/services/api.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

interface ProjectRow {
  id: number;
  project_name: string;
  project_code: string;
  category: string;
  location: string | null;
  status: string;
  budget: number | null;
  start_date: string | null;
  expected_end_date: string | null;
}

const STATUS_COLOR: Record<string, string> = {
  PLANNED: 'accent',
  IN_PROGRESS: 'primary',
  ON_HOLD: 'warn',
  COMPLETED: 'primary',
  CANCELLED: 'warn',
};

/**
 * Read-only project list, scoped server-side to what the current role may
 * see (all projects for Admin, managed projects for a Project Manager,
 * client's own projects for a Client, etc). Full CRUD workflows for
 * projects are implemented in a later milestone.
 */
@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatChipsModule, MatIconModule, LoadingComponent],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.scss',
})
export class ProjectListComponent implements OnInit {
  private api = inject(ApiService);

  isLoading = signal(true);
  projects = signal<ProjectRow[]>([]);

  ngOnInit(): void {
    this.api.get<ProjectRow[]>('/projects').subscribe({
      next: (res) => {
        this.projects.set(res ?? []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  statusColor(status: string): string {
    return STATUS_COLOR[status] ?? 'primary';
  }
}

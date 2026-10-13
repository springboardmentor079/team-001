import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { ProjectService } from '../../../core/services/project.service';
import { Milestone, Project } from '../../../core/models/domain.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-milestones',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule,
  ],
  templateUrl: './milestones.component.html',
})
export class MilestonesComponent implements OnInit {
  projects = signal<Project[]>([]);
  milestones = signal<Milestone[]>([]);
  selectedProjectId = signal<number | null>(null);
  errorMessage = signal<string | null>(null);
  categories = ['foundation', 'structural', 'electrical', 'plumbing', 'finishing', 'inspection'];
  statuses = ['pending', 'in_progress', 'completed', 'delayed'];

  form: any;

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    public authService: AuthService
  ) {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2)]],
      category: ['foundation', [Validators.required]],
      due_date: [null],
    });
  }

  ngOnInit(): void {
    this.projectService.list().subscribe((data) => this.projects.set(data));
  }

  get canManage(): boolean {
    return this.authService.hasRole('admin', 'project_manager', 'site_engineer');
  }

  onProjectSelect(id: string): void {
    const projectId = Number(id);
    this.selectedProjectId.set(projectId);
    this.projectService.listMilestones(projectId).subscribe((data) => this.milestones.set(data));
  }

  onSubmit(): void {
    const projectId = this.selectedProjectId();
    if (!projectId || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.projectService.addMilestone(projectId, { ...v, due_date: v.due_date || null } as any).subscribe({
      next: () => {
        this.form.reset({ title: '', category: 'foundation', due_date: null });
        this.onProjectSelect(String(projectId));
      },
      error: (err) => this.errorMessage.set(err?.error?.detail || 'Could not add milestone.'),
    });
  }

  completion(): number {
    const all = this.milestones();
    return all.length ? Math.round((all.filter((m) => m.status === 'completed').length / all.length) * 100) : 0;
  }

  isOverdue(m: Milestone): boolean {
    return !!m.due_date && m.status !== 'completed' && new Date(m.due_date) < new Date(new Date().toDateString());
  }

  onStatusChange(milestoneId: number, status: string): void {
    this.projectService.updateMilestone(milestoneId, { status } as any).subscribe(() => {
      const projectId = this.selectedProjectId();
      if (projectId) this.onProjectSelect(String(projectId));
    });
  }
}


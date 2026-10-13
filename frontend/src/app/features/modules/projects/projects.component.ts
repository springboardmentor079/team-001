import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../core/models/domain.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule,
  ],
  templateUrl: './projects.component.html',
})
export class ProjectsComponent implements OnInit {
  projects = signal<Project[]>([]);
  search = signal('');
  statusFilter = signal('');
  errorMessage = signal<string | null>(null);

  categories = ['residential', 'commercial', 'industrial', 'infrastructure', 'government'];
  statuses = ['planned', 'in_progress', 'on_hold', 'completed', 'closed'];
  form: any;

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    public authService: AuthService
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      category: ['residential', [Validators.required]],
      budget: [0],
      start_date: [null],
      end_date: [null],
      description: [''],
    });
  }

  ngOnInit(): void {
    this.fetchProjects();
  }

  get canManage(): boolean {
    return this.authService.hasRole('admin', 'project_manager');
  }

  visible(): Project[] {
    const q = this.search().toLowerCase().trim();
    const st = this.statusFilter();
    return this.projects().filter(
      (p) => (!st || p.status === st) && (!q || p.name.toLowerCase().includes(q) || p.category.includes(q))
    );
  }

  fetchProjects(): void {
    this.projectService.list().subscribe((data) => this.projects.set(data));
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.errorMessage.set(null);
    const v = this.form.getRawValue();
    this.projectService
      .create({ ...v, start_date: v.start_date || null, end_date: v.end_date || null })
      .subscribe({
        next: () => {
          this.form.reset({ name: '', category: 'residential', budget: 0, start_date: null, end_date: null, description: '' });
          this.fetchProjects();
        },
        error: (err) => this.errorMessage.set(err?.error?.detail?.[0]?.msg || err?.error?.detail || 'Could not create project.'),
      });
  }

  changeStatus(p: Project, status: string): void {
    this.projectService.update(p.id, { status }).subscribe({
      next: () => this.fetchProjects(),
      error: (err) => this.errorMessage.set(err?.error?.detail || 'Could not update status.'),
    });
  }

  remove(p: Project): void {
    if (!confirm(`Delete project "${p.name}"? This cannot be undone.`)) return;
    this.projectService.delete(p.id).subscribe({
      next: () => this.fetchProjects(),
      error: () =>
        this.errorMessage.set('Could not delete — remove its milestones, workers, expenses and documents first.'),
    });
  }
}

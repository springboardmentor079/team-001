import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { ResourceService } from '../../../core/services/resource.service';
import { ProjectService } from '../../../core/services/project.service';
import { Project, ResourceItem } from '../../../core/models/domain.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-resources',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule,
  ],
  templateUrl: './resources.component.html',
})
export class ResourcesComponent implements OnInit {
  resources = signal<ResourceItem[]>([]);
  projects = signal<Project[]>([]);
  statuses = ['available', 'in_use', 'maintenance', 'unavailable'];
  errorMessage = signal<string | null>(null);
  categories = ['excavator', 'concrete_mixer', 'crane', 'dump_truck', 'generator', 'safety_equipment'];

  form: any;

  constructor(
    private fb: FormBuilder,
    private resourceService: ResourceService,
    private projectService: ProjectService,
    public authService: AuthService
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      category: ['excavator', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.fetch();
    this.projectService.list().subscribe((p) => this.projects.set(p));
  }

  projectName(id: number | null): string {
    return this.projects().find((p) => p.id === id)?.name ?? '—';
  }

  changeStatus(r: ResourceItem, status: string): void {
    this.resourceService.updateResource(r.id, { status }).subscribe(() => this.fetch());
  }

  assign(r: ResourceItem, value: string): void {
    this.resourceService
      .updateResource(r.id, { project_id: value ? Number(value) : null, status: value ? 'in_use' : 'available' })
      .subscribe(() => this.fetch());
  }

  utilisation(): number {
    const all = this.resources();
    return all.length ? Math.round((all.filter((r) => r.status === 'in_use').length / all.length) * 100) : 0;
  }

  get canManage(): boolean {
    return this.authService.hasRole('admin', 'project_manager', 'site_engineer');
  }

  fetch(): void {
    this.resourceService.listResources().subscribe((data) => this.resources.set(data));
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.resourceService.createResource(this.form.getRawValue() as any).subscribe({
      next: () => {
        this.form.reset({ name: '', category: 'excavator' });
        this.fetch();
      },
      error: (err) => this.errorMessage.set(err?.error?.detail || 'Could not add resource.'),
    });
  }
}

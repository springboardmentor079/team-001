import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, ViewportScroller } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { ApiResponse, errorMessage, roleLabel } from '../../core/models';
interface TeamMember {
  id: string;
  name: string;
  role: string;
  active?: boolean;
}
interface Project {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  address: string;
  city: string;
  state: string;
  country: string;
  priority: string;
  status: string;
  startDate: string;
  endDate: string;
  budget?: string;
  estimatedCost?: string;
  notes: string;
  members: { user: TeamMember }[];
  schedule: { progress: number; basis: string; total: number; completed: number; overdue: number };
}
@Component({
  selector: 'bt-projects',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './projects.component.html',
})
export class ProjectsComponent {
  private viewport = inject(ViewportScroller);
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  readonly auth = inject(AuthService);
  readonly projects = signal<Project[]>([]);
  readonly project = signal<Project | null>(null);
  readonly team = signal<TeamMember[]>([]);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly editing = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  readonly page = signal(1);
  readonly total = signal(0);
  readonly totalPages = signal(1);
  readonly label = roleLabel;
  readonly statuses = [
    'PLANNING',
    'ACTIVE',
    'ON_HOLD',
    'DELAYED',
    'COMPLETED',
    'CLOSED',
    'CANCELLED',
  ];
  readonly filter = this.fb.nonNullable.group({
    search: [''],
    status: [''],
    sort: ['createdAt'],
    direction: ['desc'],
  });
  readonly form = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.pattern(/^[A-Z0-9-]+$/)]],
    name: ['', [Validators.required, Validators.maxLength(150)]],
    description: [''],
    category: ['Residential', Validators.required],
    address: ['', Validators.required],
    city: ['', Validators.required],
    state: ['', Validators.required],
    country: ['India', Validators.required],
    priority: ['MEDIUM'],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    budget: ['0', [Validators.required, Validators.pattern(/^\d{1,14}(\.\d{1,2})?$/)]],
    estimatedCost: ['0', [Validators.required, Validators.pattern(/^\d{1,14}(\.\d{1,2})?$/)]],
    notes: [''],
    memberIds: [[] as string[]],
  });
  constructor() {
    this.load();
  }
  can(permission: string) {
    return !!this.auth.user()?.permissions.includes(permission);
  }
  get detailId() {
    return this.route.snapshot.paramMap.get('id');
  }
  get activeCount() {
    return this.projects().filter((p) => p.status === 'ACTIVE').length;
  }
  get delayedCount() {
    return this.projects().filter((p) => p.status === 'DELAYED').length;
  }
  get transitions() {
    const options: Record<string, string[]> = {
      PLANNING: ['ACTIVE', 'CANCELLED'],
      ACTIVE: ['ON_HOLD', 'DELAYED', 'COMPLETED', 'CANCELLED'],
      ON_HOLD: ['ACTIVE', 'CANCELLED'],
      DELAYED: ['ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'],
      COMPLETED: ['ACTIVE', 'CLOSED'],
      CLOSED: [],
      CANCELLED: [],
    };
    return options[this.project()?.status || ''] || [];
  }
  load() {
    this.loading.set(true);
    this.error.set('');
    if (this.detailId) {
      this.http
        .get<ApiResponse<Project>>('/api/v1/projects/' + this.detailId)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: (r) => this.project.set(r.data),
          error: (e) => this.error.set(errorMessage(e)),
        });
    } else {
      const filter = this.filter.getRawValue();
      let params = new HttpParams();
      params = params
        .set('page', this.page())
        .set('limit', 12)
        .set('sort', filter.sort)
        .set('direction', filter.direction);
      if (filter.search.trim()) params = params.set('search', filter.search.trim());
      if (filter.status) params = params.set('status', filter.status);
      this.http
        .get<ApiResponse<Project[]>>('/api/v1/projects', { params })
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: (r) => {
            this.projects.set(r.data);
            this.total.set(r.meta?.total ?? r.data.length);
            this.totalPages.set(r.meta?.totalPages ?? 1);
          },
          error: (e) => this.error.set(errorMessage(e)),
        });
    }
  }
  applyFilters() {
    this.page.set(1);
    this.load();
  }
  changePage(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.page.set(page);
    this.load();
  }
  edit() {
    const p = this.project();
    this.error.set('');
    this.message.set('');
    this.editing.set(true);
    this.form.reset({
      code: p?.code || '',
      name: p?.name || '',
      description: p?.description || '',
      category: p?.category || 'Residential',
      address: p?.address || '',
      city: p?.city || '',
      state: p?.state || '',
      country: p?.country || 'India',
      priority: p?.priority || 'MEDIUM',
      startDate: p?.startDate.slice(0, 10) || '',
      endDate: p?.endDate.slice(0, 10) || '',
      budget: p?.budget || '0',
      estimatedCost: p?.estimatedCost || '0',
      notes: p?.notes || '',
      memberIds: p?.members.filter((m) => m.user.active).map((m) => m.user.id) || [],
    });
    this.http.get<ApiResponse<TeamMember[]>>('/api/v1/projects/team-options').subscribe({
      next: (r) => this.team.set(r.data),
      error: (e) => this.error.set(errorMessage(e)),
    });
  }
  save() {
    if (this.busy()) return;
    this.error.set('');
    const data = this.form.getRawValue();
    if (this.form.invalid || data.endDate < data.startDate) {
      this.error.set(
        'Complete the required fields, use a unique uppercase project code, and check the date range and amounts.',
      );
      return;
    }
    this.busy.set(true);
    const request = this.project()
      ? this.http.patch<ApiResponse<Project>>('/api/v1/projects/' + this.project()!.id, data)
      : this.http.post<ApiResponse<Project>>('/api/v1/projects', data);
    request.pipe(finalize(() => this.busy.set(false))).subscribe({
      next: (r) => {
        this.editing.set(false);
        this.viewport.scrollToPosition([0, 0]);
        this.message.set(r.message);
        if (this.project()) this.project.set(r.data);
        else void this.router.navigate(['/projects', r.data.id]);
      },
      error: (e) => this.error.set(errorMessage(e)),
    });
  }
  changeStatus(status: string) {
    if (!status || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    this.message.set('');
    this.http
      .patch<ApiResponse<Project>>('/api/v1/projects/' + this.project()!.id + '/status', { status })
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: (r) => {
          this.project.set(r.data);
          this.message.set(r.message);
        },
        error: (e) => this.error.set(errorMessage(e)),
      });
  }
}

import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { ApiResponse, errorMessage, roleLabel } from '../../core/models';
interface Person {
  id: string;
  name: string;
}
interface Item {
  id: string;
  kind: string;
  name: string;
  description: string;
  startDate: string;
  plannedDate: string;
  actualDate: string | null;
  status: string;
  progress: number;
  weight: string;
  baselineStartDate: string | null;
  baselinePlannedDate: string | null;
  responsibleId: string | null;
  dependencyId: string | null;
  version: number;
  responsible: Person | null;
}
interface Schedule {
  items: Item[];
  summary: { progress: number; basis: string; total: number; completed: number; overdue: number };
}
interface Project {
  id: string;
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  members: { user: Person & { active: boolean } }[];
}
@Component({
  selector: 'bt-schedule',
  imports: [ReactiveFormsModule, RouterLink, DatePipe],
  templateUrl: './schedule.component.html',
})
export class ScheduleComponent {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  readonly auth = inject(AuthService);
  readonly label = roleLabel;
  readonly projectId = this.route.snapshot.paramMap.get('id')!;
  readonly project = signal<Project | null>(null);
  readonly data = signal<Schedule | null>(null);
  readonly editing = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  readonly selected = signal<Item | null>(null);
  readonly form = this.fb.nonNullable.group({
    kind: ['MILESTONE', Validators.required],
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    startDate: ['', Validators.required],
    plannedDate: ['', Validators.required],
    actualDate: [''],
    status: ['NOT_STARTED'],
    progress: [0, [Validators.min(0), Validators.max(100)]],
    weight: ['1', [Validators.required, Validators.min(0.01)]],
    rebaseline: [false],
    responsibleId: [''],
    dependencyId: [''],
  });
  constructor() {
    this.load();
  }
  can(permission: string) {
    return !!this.auth.user()?.permissions.includes(permission);
  }
  load() {
    this.error.set('');
    Promise.all([
      this.http.get<ApiResponse<Project>>('/api/v1/projects/' + this.projectId).toPromise(),
      this.http
        .get<ApiResponse<Schedule>>(`/api/v1/projects/${this.projectId}/schedule`)
        .toPromise(),
    ])
      .then(([p, s]) => {
        this.project.set(p!.data);
        this.data.set(s!.data);
      })
      .catch((e) => this.error.set(errorMessage(e)));
  }
  edit(item?: Item) {
    this.selected.set(item || null);
    const p = this.project();
    this.form.reset({
      kind: item?.kind || 'MILESTONE',
      name: item?.name || '',
      description: item?.description || '',
      startDate: item?.startDate.slice(0, 10) || p?.startDate.slice(0, 10) || '',
      plannedDate: item?.plannedDate.slice(0, 10) || p?.endDate.slice(0, 10) || '',
      actualDate: item?.actualDate?.slice(0, 10) || '',
      status: item?.status || 'NOT_STARTED',
      progress: item?.progress || 0,
      weight: item?.weight || '1',
      rebaseline: false,
      responsibleId: item?.responsibleId || '',
      dependencyId: item?.dependencyId || '',
    });
    this.editing.set(true);
    this.error.set('');
  }
  save() {
    if (this.form.invalid || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    const raw = this.form.getRawValue();
    const body = {
      ...raw,
      actualDate: raw.actualDate || null,
      responsibleId: raw.responsibleId || null,
      dependencyId: raw.dependencyId || null,
      version: this.selected()?.version,
    };
    const request = this.selected()
      ? this.http.patch<ApiResponse<Item>>(
          `/api/v1/projects/${this.projectId}/schedule/${this.selected()!.id}`,
          body,
        )
      : this.http.post<ApiResponse<Item>>(`/api/v1/projects/${this.projectId}/schedule`, body);
    request.pipe(finalize(() => this.busy.set(false))).subscribe({
      next: (r) => {
        this.message.set(r.message);
        this.editing.set(false);
        this.load();
      },
      error: (e) => this.error.set(errorMessage(e)),
    });
  }
}

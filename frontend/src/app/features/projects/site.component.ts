import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { ApiResponse, errorMessage, roleLabel } from '../../core/models';
interface SiteData {
  reports: SiteReport[];
  delays: SiteDelay[];
  inspections: Inspection[];
  weeks: {
    week: string;
    reports: number;
    workerObservations: number;
    lastReportedProgress: number;
    lastDate: string;
  }[];
  activity: { id: string; action: string; createdAt: string; actor: { name: string } | null }[];
}
interface SiteReport {
  id: string;
  reportDate: string;
  weather: string;
  workersPresent: number;
  workCompleted: string;
  reportedProgress: number;
  safetyObservations: string;
  author: { name: string } | null;
}
interface SiteDelay {
  id: string;
  date: string;
  cause: string;
  daysDelayed: number;
  impact: string;
  correctiveAction: string;
  critical: boolean;
  status: string;
  version: number;
}
interface Inspection {
  id: string;
  date: string;
  location: string;
  type: string;
  result: string;
  findings: string;
  correctiveAction: string;
  resolved: boolean;
  version: number;
}
interface ProjectSummary {
  id: string;
  name: string;
}
@Component({
  selector: 'bt-site',
  imports: [ReactiveFormsModule, RouterLink, DatePipe],
  templateUrl: './site.component.html',
})
export class SiteComponent {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  readonly auth = inject(AuthService);
  readonly label = roleLabel;
  readonly projectId = this.route.snapshot.paramMap.get('id')!;
  readonly project = signal<ProjectSummary | null>(null);
  readonly data = signal<SiteData | null>(null);
  readonly mode = signal<'report' | 'delay' | 'inspection' | null>(null);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  readonly reportForm = this.fb.nonNullable.group({
    reportDate: ['', Validators.required],
    weather: ['', Validators.required],
    workersPresent: [0, [Validators.required, Validators.min(0)]],
    workCompleted: ['', Validators.required],
    reportedProgress: [0, [Validators.min(0), Validators.max(100)]],
    materialsUsed: [''],
    equipmentUsed: [''],
    safetyObservations: [''],
    issues: [''],
    notes: [''],
  });
  readonly delayForm = this.fb.nonNullable.group({
    date: ['', Validators.required],
    cause: ['', Validators.required],
    daysDelayed: [1, [Validators.required, Validators.min(1)]],
    impact: ['', Validators.required],
    correctiveAction: [''],
    critical: [false],
    workItemId: [''],
  });
  readonly inspectionForm = this.fb.nonNullable.group({
    date: ['', Validators.required],
    location: ['', Validators.required],
    type: ['Safety', Validators.required],
    result: ['PASSED'],
    findings: ['', Validators.required],
    correctiveAction: [''],
  });
  constructor() {
    this.load();
  }
  can(p: string) {
    return !!this.auth.user()?.permissions.includes(p);
  }
  load() {
    this.error.set('');
    Promise.all([
      this.http.get<ApiResponse<ProjectSummary>>('/api/v1/projects/' + this.projectId).toPromise(),
      this.http.get<ApiResponse<SiteData>>(`/api/v1/projects/${this.projectId}/site`).toPromise(),
    ])
      .then(([p, d]) => {
        this.project.set(p!.data);
        this.data.set(d!.data);
      })
      .catch((e) => this.error.set(errorMessage(e)));
  }
  save(kind: 'report' | 'delay' | 'inspection') {
    if (this.busy()) return;
    if (kind === 'report' && this.reportForm.invalid) return;
    if (kind === 'delay' && this.delayForm.invalid) return;
    if (kind === 'inspection' && this.inspectionForm.invalid) return;
    this.busy.set(true);
    this.error.set('');
    const value =
      kind === 'report'
        ? this.reportForm.getRawValue()
        : kind === 'delay'
          ? {
              ...this.delayForm.getRawValue(),
              workItemId: this.delayForm.controls.workItemId.value || null,
            }
          : this.inspectionForm.getRawValue();
    this.http
      .post<ApiResponse<unknown>>(
        `/api/v1/projects/${this.projectId}/site/${kind === 'report' ? 'reports' : kind === 'delay' ? 'delays' : 'inspections'}`,
        value,
      )
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: (r) => {
          this.message.set(r.message);
          this.mode.set(null);
          if (kind === 'report') this.reportForm.reset();
          if (kind === 'delay') this.delayForm.reset();
          if (kind === 'inspection') this.inspectionForm.reset();
          this.load();
        },
        error: (e) => this.error.set(errorMessage(e)),
      });
  }
  updateDelay(item: SiteDelay, status: string) {
    const correctiveAction = item.correctiveAction || 'Reviewed by the project team.';
    this.busy.set(true);
    this.http
      .patch<ApiResponse<SiteDelay>>(`/api/v1/projects/${this.projectId}/site/delays/${item.id}`, {
        status,
        correctiveAction,
        version: item.version,
      })
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: (r) => {
          this.message.set(r.message);
          this.load();
        },
        error: (e) => this.error.set(errorMessage(e)),
      });
  }
  resolveInspection(item: Inspection) {
    this.busy.set(true);
    this.http
      .patch<ApiResponse<Inspection>>(
        `/api/v1/projects/${this.projectId}/site/inspections/${item.id}`,
        {
          resolved: true,
          correctiveAction: item.correctiveAction || 'Corrective action completed and verified.',
          version: item.version,
        },
      )
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: (r) => {
          this.message.set(r.message);
          this.load();
        },
        error: (e) => this.error.set(errorMessage(e)),
      });
  }
}

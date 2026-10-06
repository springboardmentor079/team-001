import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { ApiResponse, errorMessage, roleLabel } from '../../core/models';

interface Project { id: string; name: string; status: string }
interface Assignment { id: string; project: { id: string; name: string }; startDate: string; endDate: string | null; role: string }
interface Worker { id: string; employeeCode: string; name: string; category: string; phone: string; hourlyRate: string; status: string; version: number; assignments: Assignment[] }
interface Attendance { id: string; worker: { id: string; name: string }; project: { id: string; name: string }; workDate: string; status: string; hours: string; approved: boolean; version: number }
interface Shift { id: string; worker: { id: string; name: string }; project: { id: string; name: string }; startAt: string; endAt: string; location: string }
interface Payroll { workerId: string; worker: string; approvedHours: string; hourlyRate: string; estimatedPay: string }
interface WorkforceData {
  workers: Worker[]; attendance: Attendance[]; shifts: Shift[]; payroll: Payroll[];
  summary: { total: number; active: number; onLeave: number; approvedHours: string; estimatedPayroll: string };
}
@Component({
  selector: 'bt-workforce',
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe],
  templateUrl: './workforce.component.html',
})
export class WorkforceComponent {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  readonly auth = inject(AuthService);
  readonly label = roleLabel;
  readonly data = signal<WorkforceData | null>(null);
  readonly projects = signal<Project[]>([]);
  readonly mode = signal<'worker' | 'assignment' | 'attendance' | 'shift' | null>(null);
  readonly selected = signal<Worker | null>(null);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  readonly workerForm = this.fb.nonNullable.group({
    employeeCode: ['', Validators.required], name: ['', Validators.required],
    category: ['Skilled labour', Validators.required], phone: [''], hourlyRate: ['', Validators.required],
    status: ['ACTIVE'], userId: [null as string | null],
  });
  readonly assignmentForm = this.fb.group({
    projectId: ['', Validators.required], startDate: ['', Validators.required], endDate: [null as string | null], role: ['', Validators.required],
  });
  readonly attendanceForm = this.fb.nonNullable.group({
    workerId: ['', Validators.required], projectId: ['', Validators.required], workDate: ['', Validators.required],
    status: ['PRESENT'], hours: ['8', Validators.required], approved: [true], notes: [''],
  });
  readonly shiftForm = this.fb.nonNullable.group({
    workerId: ['', Validators.required], projectId: ['', Validators.required], startAt: ['', Validators.required],
    endAt: ['', Validators.required], location: [''], notes: [''],
  });
  constructor() { this.load(); }
  can(permission: string) { return !!this.auth.user()?.permissions.includes(permission); }
  load() {
    this.http.get<ApiResponse<WorkforceData>>('/api/v1/workforce').subscribe({ next: (r) => this.data.set(r.data), error: (e) => this.error.set(errorMessage(e)) });
    if (this.can('WORKER_CREATE') || this.can('ATTENDANCE_MANAGE') || this.can('SHIFT_MANAGE'))
      this.http.get<ApiResponse<Project[]>>('/api/v1/projects').subscribe((r) => this.projects.set(r.data.filter((p) => !['COMPLETED', 'CLOSED', 'CANCELLED'].includes(p.status))));
  }
  open(mode: 'worker' | 'assignment' | 'attendance' | 'shift', worker?: Worker) {
    this.mode.set(mode); this.selected.set(worker || null); this.error.set('');
    if (worker && mode === 'assignment') this.assignmentForm.reset({ projectId: '', startDate: '', endDate: null, role: worker.category });
  }
  saveWorker() { if (this.workerForm.invalid) return; this.run(this.http.post<ApiResponse<Worker>>('/api/v1/workforce/workers', this.workerForm.getRawValue())); }
  saveAssignment() {
    if (this.assignmentForm.invalid || !this.selected()) return;
    const raw = this.assignmentForm.getRawValue();
    this.run(this.http.post<ApiResponse<Assignment>>(`/api/v1/workforce/workers/${this.selected()!.id}/assignments`, { ...raw, endDate: raw.endDate || null }));
  }
  saveAttendance() { if (this.attendanceForm.invalid) return; this.run(this.http.post<ApiResponse<Attendance>>('/api/v1/workforce/attendance', this.attendanceForm.getRawValue())); }
  saveShift() {
    if (this.shiftForm.invalid) return;
    const raw = this.shiftForm.getRawValue();
    this.run(this.http.post<ApiResponse<Shift>>('/api/v1/workforce/shifts', { ...raw, startAt: new Date(raw.startAt).toISOString(), endAt: new Date(raw.endAt).toISOString() }));
  }
  approve(row: Attendance, approved: boolean) { this.run(this.http.patch<ApiResponse<Attendance>>(`/api/v1/workforce/attendance/${row.id}/approval`, { approved, version: row.version })); }
  private run(request: ReturnType<HttpClient['post']>) {
    this.busy.set(true);
    request.pipe(finalize(() => this.busy.set(false))).subscribe({
      next: (result: unknown) => { this.message.set((result as ApiResponse<unknown>).message); this.mode.set(null); this.load(); },
      error: (e) => this.error.set(errorMessage(e)),
    });
  }
}

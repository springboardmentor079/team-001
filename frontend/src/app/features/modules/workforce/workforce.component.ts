import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { WorkforceService } from '../../../core/services/workforce.service';
import { ProjectService } from '../../../core/services/project.service';
import { AuthService } from '../../../core/services/auth.service';
import { AttendanceRecord, PayrollReport, Project, Shift, Worker } from '../../../core/models/domain.model';
import { addDays, mondayOf, monthStartIso, todayIso, weekdayLabel } from '../../../core/util/dates';
import { saveBlob } from '../../../core/util/download';

type Tab = 'workers' | 'attendance' | 'shifts' | 'payroll';

@Component({
  selector: 'app-workforce',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule,
  ],
  templateUrl: './workforce.component.html',
})
export class WorkforceComponent implements OnInit {
  tab = signal<Tab>('workers');
  workers = signal<Worker[]>([]);
  projects = signal<Project[]>([]);
  attendance = signal<AttendanceRecord[]>([]);
  attendanceDate = signal<string>(todayIso());
  errorMessage = signal<string | null>(null);
  attendanceMessage = signal<string | null>(null);

  // shifts
  shifts = signal<Shift[]>([]);
  weekStart = signal<string>(mondayOf(todayIso()));
  shiftMessage = signal<string | null>(null);
  shiftTypes = ['morning', 'evening', 'night'];

  // payroll
  payrollStart = signal<string>(monthStartIso());
  payrollEnd = signal<string>(todayIso());
  payroll = signal<PayrollReport | null>(null);
  payrollError = signal<string | null>(null);

  categories = ['engineer', 'supervisor', 'contractor', 'skilled', 'unskilled', 'consultant'];
  statuses = ['present', 'absent', 'half_day', 'leave'];

  form: any;
  attendanceForm: any;

  constructor(
    private fb: FormBuilder,
    private workforceService: WorkforceService,
    private projectService: ProjectService,
    public authService: AuthService
  ) {
    this.form = this.fb.group({
      full_name: ['', [Validators.required, Validators.minLength(2)]],
      category: ['skilled', [Validators.required]],
      contact_number: [''],
      daily_wage: [0],
      project_id: [null],
    });
    this.attendanceForm = this.fb.group({
      worker_id: [null, [Validators.required]],
      project_id: [null, [Validators.required]],
      date: [todayIso(), [Validators.required]],
      status: ['present', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.fetchWorkers();
    this.fetchAttendance();
    this.loadShifts();
    this.projectService.list().subscribe((p) => this.projects.set(p));
  }

  get canManageWorkers(): boolean {
    return this.authService.hasRole('admin', 'project_manager', 'contractor');
  }

  get canViewPayroll(): boolean {
    return this.authService.hasRole('admin', 'project_manager');
  }

  get canMarkAttendance(): boolean {
    return this.authService.hasRole('admin', 'project_manager', 'contractor', 'site_engineer');
  }

  workerName(id: number): string {
    return this.workers().find((w) => w.id === id)?.full_name ?? `#${id}`;
  }

  projectName(id: number | null): string {
    return this.projects().find((p) => p.id === id)?.name ?? '—';
  }

  fetchWorkers(): void {
    this.workforceService.listWorkers().subscribe((data) => this.workers.set(data));
  }

  fetchAttendance(): void {
    this.workforceService.listAttendance().subscribe((data) => this.attendance.set(data));
  }

  onWorkerSelected(workerId: number): void {
    // Pre-select the worker's own project to save a click.
    const worker = this.workers().find((w) => w.id === workerId);
    if (worker?.project_id) this.attendanceForm.patchValue({ project_id: worker.project_id });
  }

  addWorker(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.errorMessage.set(null);
    const v = this.form.getRawValue();
    this.workforceService.createWorker({ ...v, project_id: v.project_id || null }).subscribe({
      next: () => {
        this.form.reset({ full_name: '', category: 'skilled', contact_number: '', daily_wage: 0, project_id: null });
        this.fetchWorkers();
      },
      error: (err) => this.errorMessage.set(err?.error?.detail || 'Could not add worker.'),
    });
  }

  removeWorker(w: Worker): void {
    if (!confirm(`Remove ${w.full_name}?`)) return;
    this.workforceService.deleteWorker(w.id).subscribe({
      next: () => this.fetchWorkers(),
      error: (err) => this.errorMessage.set(err?.error?.detail || 'Could not remove worker. Attendance records may exist.'),
    });
  }

  markAttendance(): void {
    if (this.attendanceForm.invalid) {
      this.attendanceForm.markAllAsTouched();
      return;
    }
    this.attendanceMessage.set(null);
    this.workforceService.markAttendance(this.attendanceForm.getRawValue()).subscribe({
      next: (rec) => {
        this.attendanceMessage.set(`Saved: ${this.workerName(rec.worker_id)} — ${rec.status} on ${rec.date}`);
        this.fetchAttendance();
      },
      error: (err) => this.attendanceMessage.set(err?.error?.detail || 'Could not save attendance.'),
    });
  }

  /** One-click marking from the daily roster. */
  quickMark(w: Worker, status: string): void {
    const projectId = w.project_id ?? this.projects()[0]?.id;
    if (!projectId) {
      this.attendanceMessage.set('Create a project first, then assign it to the worker.');
      return;
    }
    this.workforceService
      .markAttendance({ worker_id: w.id, project_id: projectId, date: this.attendanceDate(), status })
      .subscribe({
        next: () => this.fetchAttendance(),
        error: (err) => this.attendanceMessage.set(err?.error?.detail || 'Could not save attendance.'),
      });
  }

  statusOn(workerId: number): string | null {
    return this.attendance().find((a) => a.worker_id === workerId && a.date === this.attendanceDate())?.status ?? null;
  }

  onDateChange(value: string): void {
    this.attendanceDate.set(value);
  }

  presentToday(): number {
    return this.attendance().filter((a) => a.date === this.attendanceDate() && a.status === 'present').length;
  }

  history(): AttendanceRecord[] {
    return this.attendance().slice(0, 50);
  }

  // ---------------------------------------------------------------- shifts
  weekDays(): string[] {
    return Array.from({ length: 7 }, (_, i) => addDays(this.weekStart(), i));
  }

  dayLabel(iso: string): string {
    return weekdayLabel(iso);
  }

  loadShifts(): void {
    this.workforceService
      .listShifts(this.weekStart(), addDays(this.weekStart(), 6))
      .subscribe((data) => this.shifts.set(data));
  }

  moveWeek(delta: number): void {
    this.weekStart.set(addDays(this.weekStart(), delta * 7));
    this.loadShifts();
  }

  thisWeek(): void {
    this.weekStart.set(mondayOf(todayIso()));
    this.loadShifts();
  }

  shiftFor(workerId: number, date: string): Shift | undefined {
    return this.shifts().find((s) => s.worker_id === workerId && s.shift_date === date);
  }

  shiftCount(type: string): number {
    return this.shifts().filter((s) => s.shift_type === type).length;
  }

  onShiftChange(worker: Worker, date: string, value: string): void {
    this.shiftMessage.set(null);
    const existing = this.shiftFor(worker.id, date);
    if (!value) {
      if (existing) this.workforceService.deleteShift(existing.id).subscribe(() => this.loadShifts());
      return;
    }
    const projectId = worker.project_id ?? this.projects()[0]?.id;
    if (!projectId) {
      this.shiftMessage.set('Create a project first, then assign it to the worker.');
      this.loadShifts();
      return;
    }
    this.workforceService
      .assignShift({ worker_id: worker.id, project_id: projectId, shift_date: date, shift_type: value })
      .subscribe({
        next: () => this.loadShifts(),
        error: (err) => {
          this.shiftMessage.set(err?.error?.detail || 'Could not save shift.');
          this.loadShifts();
        },
      });
  }

  // --------------------------------------------------------------- payroll
  loadPayroll(): void {
    this.payrollError.set(null);
    this.workforceService.payroll(this.payrollStart(), this.payrollEnd()).subscribe({
      next: (r) => this.payroll.set(r),
      error: (err) => {
        this.payroll.set(null);
        this.payrollError.set(err?.error?.detail || 'Could not calculate payroll.');
      },
    });
  }

  openPayroll(): void {
    this.tab.set('payroll');
    if (!this.payroll()) this.loadPayroll();
  }

  exportPayrollCsv(): void {
    const r = this.payroll();
    if (!r) return;
    const header = ['Worker', 'Category', 'Daily wage', 'Present', 'Half days', 'Absent', 'Leave', 'Payable days', 'Amount'];
    const rows = r.lines.map((l) => [l.worker_name, l.category, l.daily_wage, l.present_days, l.half_days, l.absent_days, l.leave_days, l.payable_days, l.amount]);
    const csv = [header, ...rows, [], ['Total', '', '', '', '', '', '', '', r.total_amount]]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    saveBlob(new Blob(['\ufeff' + csv], { type: 'text/csv' }), `buildtrack-payroll-${r.start}-to-${r.end}.csv`);
  }
}

import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { ApiResponse, errorMessage, roleLabel } from '../../core/models';
interface Allocation {
  id: string;
  project: { id: string; name: string };
  operator: { id: string; name: string } | null;
  startAt: string;
  endAt: string;
  releasedAt: string | null;
}
interface Maintenance {
  id: string;
  type: string;
  scheduledAt: string;
  priority: string;
  status: string;
  failureRelated: boolean;
  downtimeHours: string;
  version: number;
}
interface Equipment {
  id: string;
  code: string;
  name: string;
  type: string;
  location: string;
  status: string;
  hourlyRate: string;
  commissionedAt: string | null;
  serviceIntervalDays: number;
  notes: string;
  version: number;
  allocations: Allocation[];
  maintenance: Maintenance[];
}
interface Result {
  records: Equipment[];
  summary: {
    total: number;
    available: number;
    inUse: number;
    maintenance: number;
    utilization: number;
  };
}
interface Project {
  id: string;
  name: string;
  status: string;
}
@Component({
  selector: 'bt-equipment',
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe],
  templateUrl: './equipment.component.html',
})
export class EquipmentComponent {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  readonly auth = inject(AuthService);
  readonly label = roleLabel;
  readonly data = signal<Result | null>(null);
  readonly projects = signal<Project[]>([]);
  readonly mode = signal<'equipment' | 'allocate' | 'maintenance' | null>(null);
  readonly selected = signal<Equipment | null>(null);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  readonly equipmentForm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.pattern(/^[A-Z0-9-]+$/)]],
    name: ['', Validators.required],
    type: ['Excavator', Validators.required],
    location: ['', Validators.required],
    hourlyRate: ['0', Validators.required],
    commissionedAt: [''],
    serviceIntervalDays: [90, [Validators.required, Validators.min(1), Validators.max(3650)]],
    notes: [''],
    status: ['AVAILABLE'],
  });
  readonly allocationForm = this.fb.nonNullable.group({
    projectId: ['', Validators.required],
    startAt: ['', Validators.required],
    endAt: ['', Validators.required],
    notes: [''],
  });
  readonly maintenanceForm = this.fb.nonNullable.group({
    type: ['Preventive service', Validators.required],
    scheduledAt: ['', Validators.required],
    priority: ['MEDIUM'],
    failureRelated: [false],
    downtimeHours: ['0', Validators.required],
    notes: [''],
  });
  constructor() {
    this.load();
  }
  can(p: string) {
    return !!this.auth.user()?.permissions.includes(p);
  }
  load() {
    this.http
      .get<ApiResponse<Result>>('/api/v1/equipment')
      .subscribe({
        next: (r) => this.data.set(r.data),
        error: (e) => this.error.set(errorMessage(e)),
      });
    if (this.can('RESOURCE_ALLOCATE'))
      this.http
        .get<ApiResponse<Project[]>>('/api/v1/projects')
        .subscribe((r) =>
          this.projects.set(
            r.data.filter((p) => !['CLOSED', 'CANCELLED', 'COMPLETED'].includes(p.status)),
          ),
        );
  }
  open(mode: 'equipment' | 'allocate' | 'maintenance', item?: Equipment) {
    this.mode.set(mode);
    this.selected.set(item || null);
    this.error.set('');
    if (mode === 'equipment')
      this.equipmentForm.reset({
        code: item?.code || '',
        name: item?.name || '',
        type: item?.type || 'Excavator',
        location: item?.location || '',
        hourlyRate: item?.hourlyRate || '0',
        commissionedAt: item?.commissionedAt?.slice(0, 10) || '',
        serviceIntervalDays: item?.serviceIntervalDays || 90,
        notes: item?.notes || '',
        status: item?.status || 'AVAILABLE',
      });
    if (mode === 'maintenance')
      this.maintenanceForm.reset({
        type: 'Preventive service',
        scheduledAt: '',
        priority: 'MEDIUM',
        failureRelated: false,
        downtimeHours: '0',
        notes: '',
      });
  }
  saveEquipment() {
    if (this.equipmentForm.invalid || this.busy()) return;
    this.busy.set(true);
    const item = this.selected();
    const value = this.equipmentForm.getRawValue();
    const payload = { ...value, commissionedAt: value.commissionedAt || null };
    const savedRequest = item
      ? this.http.patch<ApiResponse<Equipment>>('/api/v1/equipment/' + item.id, {
          ...payload,
          version: item.version,
        })
      : this.http.post<ApiResponse<Equipment>>('/api/v1/equipment', payload);
    this.finish(savedRequest);
  }
  allocate() {
    if (this.allocationForm.invalid || !this.selected() || this.busy()) return;
    const v = this.allocationForm.getRawValue();
    this.busy.set(true);
    this.finish(
      this.http.post<ApiResponse<Allocation>>(
        `/api/v1/equipment/${this.selected()!.id}/allocations`,
        {
          ...v,
          operatorId: null,
          startAt: new Date(v.startAt).toISOString(),
          endAt: new Date(v.endAt).toISOString(),
        },
      ),
    );
  }
  scheduleMaintenance() {
    if (this.maintenanceForm.invalid || !this.selected() || this.busy()) return;
    const v = this.maintenanceForm.getRawValue();
    this.busy.set(true);
    this.finish(
      this.http.post<ApiResponse<Maintenance>>(
        `/api/v1/equipment/${this.selected()!.id}/maintenance`,
        { ...v, scheduledAt: new Date(v.scheduledAt).toISOString() },
      ),
    );
  }
  release(item: Equipment, a: Allocation) {
    this.busy.set(true);
    this.finish(
      this.http.patch<ApiResponse<Allocation>>(
        `/api/v1/equipment/${item.id}/allocations/${a.id}/release`,
        {},
      ),
    );
  }
  maintenanceStatus(item: Equipment, m: Maintenance, status: string) {
    this.busy.set(true);
    this.finish(
      this.http.patch<ApiResponse<Maintenance>>(
        `/api/v1/equipment/${item.id}/maintenance/${m.id}`,
        { status, version: m.version },
      ),
    );
  }
  private finish(request: ReturnType<HttpClient['post']>) {
    request.pipe(finalize(() => this.busy.set(false))).subscribe({
      next: (response: unknown) => {
        this.message.set((response as ApiResponse<unknown>).message);
        this.mode.set(null);
        this.load();
      },
      error: (e) => this.error.set(errorMessage(e)),
    });
  }
}

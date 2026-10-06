import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { ApiResponse, errorMessage, roleLabel } from '../../core/models';
interface Material {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  currentStock: string;
  allocatedStock: string;
  minimumLevel: string;
  criticalLevel: string;
  unitCost: string;
  supplier: string;
  version: number;
  stockStatus: string;
}
interface Request {
  id: string;
  quantity: string;
  requiredDate: string;
  purpose: string;
  decisionNote: string;
  status: string;
  version: number;
  material: { name: string; unit: string };
  project: { name: string };
  requester: { name: string } | null;
}
interface Inventory {
  materials: Material[];
  requests: Request[];
  summary: { total: number; low: number; critical: number; out: number; pending: number };
}
interface Project {
  id: string;
  name: string;
  status: string;
}
@Component({
  selector: 'bt-inventory',
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe],
  templateUrl: './inventory.component.html',
})
export class InventoryComponent {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  readonly auth = inject(AuthService);
  readonly label = roleLabel;
  readonly data = signal<Inventory | null>(null);
  readonly projects = signal<Project[]>([]);
  readonly mode = signal<'material' | 'request' | 'adjust' | null>(null);
  readonly selected = signal<Material | null>(null);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  readonly materialForm = this.fb.nonNullable.group({
    sku: ['', Validators.required],
    name: ['', Validators.required],
    category: ['Cement', Validators.required],
    unit: ['bags', Validators.required],
    currentStock: ['0', Validators.required],
    minimumLevel: ['0', Validators.required],
    criticalLevel: ['0', Validators.required],
    unitCost: ['0', Validators.required],
    supplier: [''],
  });
  readonly requestForm = this.fb.nonNullable.group({
    projectId: ['', Validators.required],
    materialId: ['', Validators.required],
    quantity: ['', Validators.required],
    requiredDate: ['', Validators.required],
    purpose: ['', Validators.required],
    status: ['SUBMITTED'],
  });
  readonly adjustForm = this.fb.nonNullable.group({
    delta: ['', Validators.required],
    note: ['', Validators.required],
  });
  constructor() {
    this.load();
  }
  can(p: string) {
    return !!this.auth.user()?.permissions.includes(p);
  }
  load() {
    this.http
      .get<ApiResponse<Inventory>>('/api/v1/inventory')
      .subscribe({
        next: (r) => this.data.set(r.data),
        error: (e) => this.error.set(errorMessage(e)),
      });
    if (this.can('MATERIAL_REQUEST_CREATE'))
      this.http
        .get<ApiResponse<Project[]>>('/api/v1/projects')
        .subscribe((r) =>
          this.projects.set(
            r.data.filter((p) => !['CLOSED', 'CANCELLED', 'COMPLETED'].includes(p.status)),
          ),
        );
  }
  open(mode: 'material' | 'request' | 'adjust', material?: Material) {
    this.mode.set(mode);
    this.selected.set(material || null);
    this.error.set('');
  }
  saveMaterial() {
    if (this.materialForm.invalid) return;
    this.busy.set(true);
    this.finish(
      this.http.post<ApiResponse<Material>>(
        '/api/v1/inventory/materials',
        this.materialForm.getRawValue(),
      ),
    );
  }
  saveRequest() {
    if (this.requestForm.invalid) return;
    this.busy.set(true);
    this.finish(
      this.http.post<ApiResponse<Request>>(
        '/api/v1/inventory/requests',
        this.requestForm.getRawValue(),
      ),
    );
  }
  adjust() {
    if (this.adjustForm.invalid || !this.selected()) return;
    this.busy.set(true);
    this.finish(
      this.http.post<ApiResponse<Material>>(
        `/api/v1/inventory/materials/${this.selected()!.id}/adjust`,
        { ...this.adjustForm.getRawValue(), version: this.selected()!.version },
      ),
    );
  }
  transition(request: Request, status: string) {
    this.busy.set(true);
    this.finish(
      this.http.patch<ApiResponse<Request>>(`/api/v1/inventory/requests/${request.id}/status`, {
        status,
        decisionNote: `${this.label(status)} by ${this.auth.user()?.name}.`,
        version: request.version,
      }),
    );
  }
  private finish(request: ReturnType<HttpClient['post']>) {
    request.pipe(finalize(() => this.busy.set(false))).subscribe({
      next: (r: unknown) => {
        this.message.set((r as ApiResponse<unknown>).message);
        this.mode.set(null);
        this.load();
      },
      error: (e) => this.error.set(errorMessage(e)),
    });
  }
}

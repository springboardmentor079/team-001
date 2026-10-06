import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { ApiResponse, errorMessage, roleLabel } from '../../core/models';

interface Project { id: string; name: string; status: string }
interface Material { id: string; name: string; unit: string }
interface Vendor { id: string; code: string; name: string; contactName: string; status: string }
interface ProcurementRequest { id: string; quantity: string; requiredDate: string; justification: string; status: string; decisionNote: string; version: number; project: { id: string; name: string }; material: Material; requester: { name: string } | null }
interface Receipt { id: string; receiptNumber: string; quantity: string; receivedAt: string }
interface Invoice { id: string; invoiceNumber: string; amount: string; status: string; version: number; dueDate: string }
interface Order { id: string; number: string; quantity: string; receivedQuantity: string; unitPrice: string; taxRate: string; subtotal: string; taxAmount: string; total: string; status: string; version: number; expectedDate: string; vendor: Vendor; material: Material; request: { project: { id: string; name: string } }; receipts: Receipt[]; invoices: Invoice[] }
interface ProcurementData { vendors: Vendor[]; requests: ProcurementRequest[]; orders: Order[]; summary: { vendors: number; pendingApprovals: number; openOrders: number; committed: string } }
interface InventoryData { materials: Material[] }
@Component({ selector: 'bt-procurement', imports: [ReactiveFormsModule, CurrencyPipe, DatePipe], templateUrl: './procurement.component.html' })
export class ProcurementComponent {
  private http = inject(HttpClient); private fb = inject(FormBuilder);
  readonly auth = inject(AuthService); readonly label = roleLabel;
  readonly data = signal<ProcurementData | null>(null); readonly projects = signal<Project[]>([]); readonly materials = signal<Material[]>([]);
  readonly mode = signal<'vendor' | 'request' | 'order' | 'receipt' | 'invoice' | null>(null); readonly selectedOrder = signal<Order | null>(null);
  readonly busy = signal(false); readonly error = signal(''); readonly message = signal('');
  readonly vendorForm = this.fb.nonNullable.group({ code: ['', Validators.required], name: ['', Validators.required], contactName: [''], email: [''], phone: [''], address: [''], status: ['ACTIVE'] });
  readonly requestForm = this.fb.nonNullable.group({ projectId: ['', Validators.required], materialId: ['', Validators.required], quantity: ['', Validators.required], requiredDate: ['', Validators.required], justification: ['', Validators.required], status: ['SUBMITTED'] });
  readonly orderForm = this.fb.nonNullable.group({ requestId: ['', Validators.required], vendorId: ['', Validators.required], number: ['', Validators.required], unitPrice: ['', Validators.required], taxRate: ['18', Validators.required], expectedDate: ['', Validators.required], notes: [''] });
  readonly receiptForm = this.fb.nonNullable.group({ receiptNumber: ['', Validators.required], quantity: ['', Validators.required], receivedAt: ['', Validators.required], note: [''] });
  readonly invoiceForm = this.fb.nonNullable.group({ purchaseOrderId: ['', Validators.required], invoiceNumber: ['', Validators.required], invoiceDate: ['', Validators.required], dueDate: ['', Validators.required], amount: ['', Validators.required], notes: [''] });
  constructor() { this.load(); }
  can(permission: string) { return !!this.auth.user()?.permissions.includes(permission); }
  load() {
    this.http.get<ApiResponse<ProcurementData>>('/api/v1/procurement').subscribe({ next: (r) => this.data.set(r.data), error: (e) => this.error.set(errorMessage(e)) });
    if (this.can('PROCUREMENT_REQUEST')) this.http.get<ApiResponse<Project[]>>('/api/v1/projects').subscribe((r) => this.projects.set(r.data.filter((p) => !['COMPLETED', 'CLOSED', 'CANCELLED'].includes(p.status))));
    this.http.get<ApiResponse<InventoryData>>('/api/v1/inventory').subscribe({ next: (r) => this.materials.set(r.data.materials), error: () => undefined });
  }
  open(mode: 'vendor' | 'request' | 'order' | 'receipt' | 'invoice', order?: Order) {
    this.mode.set(mode); this.selectedOrder.set(order || null); this.error.set('');
    if (mode === 'receipt' && order) this.receiptForm.reset({ receiptNumber: '', quantity: String(+order.quantity - +order.receivedQuantity), receivedAt: '', note: '' });
    if (mode === 'invoice' && order) this.invoiceForm.reset({ purchaseOrderId: order.id, invoiceNumber: '', invoiceDate: '', dueDate: '', amount: order.total, notes: '' });
  }
  saveVendor() { if (this.vendorForm.invalid) return; this.run(this.http.post<ApiResponse<Vendor>>('/api/v1/procurement/vendors', this.vendorForm.getRawValue())); }
  saveRequest() { if (this.requestForm.invalid) return; this.run(this.http.post<ApiResponse<ProcurementRequest>>('/api/v1/procurement/requests', this.requestForm.getRawValue())); }
  requestStatus(row: ProcurementRequest, status: string) { this.run(this.http.patch<ApiResponse<ProcurementRequest>>(`/api/v1/procurement/requests/${row.id}/status`, { status, decisionNote: `${this.label(status)} by ${this.auth.user()?.name}.`, version: row.version })); }
  saveOrder() { if (this.orderForm.invalid) return; this.run(this.http.post<ApiResponse<Order>>('/api/v1/procurement/orders', this.orderForm.getRawValue())); }
  saveReceipt() {
    if (this.receiptForm.invalid || !this.selectedOrder()) return;
    const raw = this.receiptForm.getRawValue();
    this.run(this.http.post<ApiResponse<Receipt>>(`/api/v1/procurement/orders/${this.selectedOrder()!.id}/receipts`, { ...raw, idempotencyKey: crypto.randomUUID(), receivedAt: new Date(raw.receivedAt).toISOString() }));
  }
  saveInvoice() { if (this.invoiceForm.invalid) return; this.run(this.http.post<ApiResponse<Invoice>>('/api/v1/procurement/invoices', this.invoiceForm.getRawValue())); }
  invoiceStatus(row: Invoice, status: string) { this.run(this.http.patch<ApiResponse<Invoice>>(`/api/v1/procurement/invoices/${row.id}/status`, { status, version: row.version })); }
  private run(request: ReturnType<HttpClient['post']>) {
    this.busy.set(true); request.pipe(finalize(() => this.busy.set(false))).subscribe({ next: (result: unknown) => { this.message.set((result as ApiResponse<unknown>).message); this.mode.set(null); this.load(); }, error: (e) => this.error.set(errorMessage(e)) });
  }
}

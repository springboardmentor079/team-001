import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { ProcurementService } from '../../../core/services/procurement.service';
import { ProcurementRequest, Vendor, VendorSummary } from '../../../core/models/domain.model';
import { AuthService } from '../../../core/services/auth.service';

type Tab = 'requests' | 'vendors';

@Component({
  selector: 'app-procurement',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule,
  ],
  templateUrl: './procurement.component.html',
})
export class ProcurementComponent implements OnInit {
  tab = signal<Tab>('requests');
  requests = signal<ProcurementRequest[]>([]);
  vendors = signal<Vendor[]>([]);
  summary = signal<VendorSummary[]>([]);
  errorMessage = signal<string | null>(null);
  vendorError = signal<string | null>(null);

  categories = ['raw_materials', 'equipment', 'machinery', 'safety_equipment', 'office_supplies'];
  statuses = ['requested', 'approved', 'ordered', 'delivered', 'rejected'];

  form: any;
  vendorForm: any;

  constructor(
    private fb: FormBuilder,
    private procurementService: ProcurementService,
    public authService: AuthService
  ) {
    this.form = this.fb.group({
      item_name: ['', [Validators.required, Validators.minLength(2)]],
      category: ['raw_materials', [Validators.required]],
      vendor_name: [''],
      quantity: [0],
      cost: [0],
    });
    this.vendorForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      category: ['raw_materials', [Validators.required]],
      contact_person: [''],
      email: ['', [Validators.email]],
      phone: [''],
    });
  }

  ngOnInit(): void {
    this.fetch();
    this.fetchVendors();
  }

  get canManage(): boolean {
    return this.authService.hasRole('admin', 'project_manager', 'contractor');
  }

  get canUpdateStatus(): boolean {
    return this.authService.hasRole('admin', 'project_manager');
  }

  fetch(): void {
    this.procurementService.list().subscribe((data) => this.requests.set(data));
  }

  fetchVendors(): void {
    this.procurementService.listVendors().subscribe((v) => this.vendors.set(v));
    if (this.canUpdateStatus) this.procurementService.vendorSummary().subscribe((s) => this.summary.set(s));
  }

  summaryFor(vendorId: number): VendorSummary | undefined {
    return this.summary().find((s) => s.vendor_id === vendorId);
  }

  unpaidTotal(): number {
    return this.requests()
      .filter((r) => r.invoice_number && !r.invoice_paid)
      .reduce((sum, r) => sum + Number(r.cost), 0);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.errorMessage.set(null);
    const v = this.form.getRawValue();
    this.procurementService.create({ ...v, vendor_name: v.vendor_name || null }).subscribe({
      next: () => {
        this.form.reset({ item_name: '', category: 'raw_materials', vendor_name: '', quantity: 0, cost: 0 });
        this.fetch();
      },
      error: (err) => this.errorMessage.set(err?.error?.detail || 'Could not create request.'),
    });
  }

  onStatusChange(id: number, status: string): void {
    this.procurementService.updateStatus(id, status).subscribe(() => this.fetch());
  }

  saveInvoiceNumber(r: ProcurementRequest, value: string): void {
    const invoice_number = value.trim();
    if (invoice_number === (r.invoice_number ?? '')) return;
    this.procurementService.updateInvoice(r.id, { invoice_number }).subscribe(() => {
      this.fetch();
      this.fetchVendors();
    });
  }

  togglePaid(r: ProcurementRequest): void {
    this.procurementService.updateInvoice(r.id, { invoice_paid: !r.invoice_paid }).subscribe(() => {
      this.fetch();
      this.fetchVendors();
    });
  }

  addVendor(): void {
    if (this.vendorForm.invalid) {
      this.vendorForm.markAllAsTouched();
      return;
    }
    this.vendorError.set(null);
    const v = this.vendorForm.getRawValue();
    this.procurementService
      .createVendor({ ...v, email: v.email || null, contact_person: v.contact_person || null, phone: v.phone || null })
      .subscribe({
        next: () => {
          this.vendorForm.reset({ name: '', category: 'raw_materials', contact_person: '', email: '', phone: '' });
          this.fetchVendors();
        },
        error: (err) => this.vendorError.set(err?.error?.detail?.[0]?.msg || err?.error?.detail || 'Could not add vendor.'),
      });
  }

  removeVendor(v: Vendor): void {
    if (!confirm(`Delete vendor "${v.name}"?`)) return;
    this.procurementService.deleteVendor(v.id).subscribe({
      next: () => this.fetchVendors(),
      error: (err) => this.vendorError.set(err?.error?.detail || 'Could not delete vendor.'),
    });
  }
}

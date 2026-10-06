import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { ApiResponse, errorMessage, roleLabel } from '../../core/models';

interface Allocation { id: string; category: string; amount: string; notes: string; version: number }
interface Expense { id: string; category: string; description: string; amount: string; currency: string; expenseDate: string; sourceRef: string | null; status: string; version: number; vendor: { name: string } | null; createdBy: { name: string } | null }
interface FinanceProject { id: string; code: string; name: string; status: string; budget: string; estimatedCost: string; allocated: string; actual: string; commitment: string; forecast: string; remaining: string; utilization: string; allocations: Allocation[]; expenses: Expense[] }
interface FinanceData { projects: FinanceProject[]; summary: { budget: string; actual: string; committed: string; forecast: string; overBudget: number } }
interface Vendor { id: string; name: string; status: string }
interface ProcurementData { vendors: Vendor[] }
@Component({ selector: 'bt-finance', imports: [ReactiveFormsModule, CurrencyPipe, DatePipe, DecimalPipe], templateUrl: './finance.component.html' })
export class FinanceComponent {
  private http = inject(HttpClient); private fb = inject(FormBuilder);
  readonly auth = inject(AuthService); readonly label = roleLabel; readonly data = signal<FinanceData | null>(null); readonly vendors = signal<Vendor[]>([]);
  readonly mode = signal<'budget' | 'expense' | null>(null); readonly busy = signal(false); readonly error = signal(''); readonly message = signal('');
  readonly budgetForm = this.fb.nonNullable.group({ projectId: ['', Validators.required], category: ['', Validators.required], amount: ['', Validators.required], notes: [''] });
  readonly expenseForm = this.fb.group({ projectId: ['', Validators.required], vendorId: [null as string | null], category: ['', Validators.required], description: ['', Validators.required], amount: ['', Validators.required], currency: [this.auth.user()?.organization.currency || 'INR', Validators.required], expenseDate: ['', Validators.required], sourceRef: [null as string | null], notes: [''] });
  constructor() { this.load(); }
  can(permission: string) { return !!this.auth.user()?.permissions.includes(permission); }
  load() {
    this.http.get<ApiResponse<FinanceData>>('/api/v1/finance').subscribe({ next: (r) => this.data.set(r.data), error: (e) => this.error.set(errorMessage(e)) });
    this.http.get<ApiResponse<ProcurementData>>('/api/v1/procurement').subscribe({ next: (r) => this.vendors.set(r.data.vendors), error: () => undefined });
  }
  open(mode: 'budget' | 'expense') { this.mode.set(mode); this.error.set(''); }
  saveBudget() { if (this.budgetForm.invalid) return; this.run(this.http.post<ApiResponse<Allocation>>('/api/v1/finance/budgets', this.budgetForm.getRawValue())); }
  saveExpense() { if (this.expenseForm.invalid) return; const raw = this.expenseForm.getRawValue(); this.run(this.http.post<ApiResponse<Expense>>('/api/v1/finance/expenses', { ...raw, vendorId: raw.vendorId || null, sourceRef: raw.sourceRef || null })); }
  transition(expense: Expense, status: string) { this.run(this.http.patch<ApiResponse<Expense>>(`/api/v1/finance/expenses/${expense.id}/status`, { status, version: expense.version })); }
  private run(request: ReturnType<HttpClient['post']>) { this.busy.set(true); request.pipe(finalize(() => this.busy.set(false))).subscribe({ next: (result: unknown) => { this.message.set((result as ApiResponse<unknown>).message); this.mode.set(null); this.load(); }, error: (e) => this.error.set(errorMessage(e)) }); }
}

import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { ExpenseService } from '../../../core/services/expense.service';
import { ProjectService } from '../../../core/services/project.service';
import { AuthService } from '../../../core/services/auth.service';
import { Expense, Project, ProjectBudget } from '../../../core/models/domain.model';
import { ChartComponent } from '../../../shared/chart/chart.component';
import { todayIso } from '../../../core/util/dates';

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, ChartComponent,
  ],
  templateUrl: './budget.component.html',
})
export class BudgetComponent implements OnInit {
  overview = signal<ProjectBudget[]>([]);
  expenses = signal<Expense[]>([]);
  projects = signal<Project[]>([]);
  filterProject = signal<number | null>(null);
  errorMessage = signal<string | null>(null);

  categories = ['labor', 'material', 'equipment', 'transportation', 'maintenance', 'administrative'];
  form: any;

  constructor(
    private fb: FormBuilder,
    private expenseService: ExpenseService,
    private projectService: ProjectService,
    public authService: AuthService
  ) {
    this.form = this.fb.group({
      project_id: [null, [Validators.required]],
      category: ['labor', [Validators.required]],
      amount: [null, [Validators.required, Validators.min(1)]],
      description: [''],
      expense_date: [todayIso()],
    });
  }

  ngOnInit(): void {
    this.projectService.list().subscribe((p) => this.projects.set(p));
    this.refresh();
  }

  get canManage(): boolean {
    return this.authService.hasRole('admin', 'project_manager');
  }

  refresh(): void {
    this.expenseService.overview().subscribe((o) => this.overview.set(o));
    this.expenseService.list().subscribe((e) => this.expenses.set(e));
  }

  visibleExpenses(): Expense[] {
    const f = this.filterProject();
    return f ? this.expenses().filter((e) => e.project_id === f) : this.expenses();
  }

  projectName(id: number): string {
    return this.projects().find((p) => p.id === id)?.name ?? `#${id}`;
  }

  barClass(pct: number): string {
    return pct >= 90 ? 'danger' : pct >= 70 ? 'warn' : 'ok';
  }

  onFilterChange(value: string): void {
    this.filterProject.set(value ? Number(value) : null);
  }

  budgetLabels(): string[] {
    return this.overview().map((o) => o.project_name);
  }

  budgetSeries() {
    return [
      { label: 'Budget', data: this.overview().map((o) => o.budget) },
      { label: 'Spent', data: this.overview().map((o) => o.spent) },
    ];
  }

  categoryTotals(): Record<string, number> {
    const totals: Record<string, number> = {};
    for (const o of this.overview()) {
      for (const [cat, amt] of Object.entries(o.spent_by_category)) totals[cat] = (totals[cat] || 0) + amt;
    }
    return totals;
  }

  categoryLabels(): string[] {
    return Object.keys(this.categoryTotals());
  }

  categorySeries() {
    return [{ label: 'Spent', data: Object.values(this.categoryTotals()) }];
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.errorMessage.set(null);
    const v = this.form.getRawValue();
    this.expenseService
      .create({ ...v, amount: Number(v.amount), project_id: Number(v.project_id) })
      .subscribe({
        next: () => {
          this.form.patchValue({ amount: null, description: '' });
          this.form.markAsUntouched();
          this.refresh();
        },
        error: (err) => this.errorMessage.set(err?.error?.detail || 'Could not record expense.'),
      });
  }

  remove(e: Expense): void {
    if (!confirm('Delete this expense?')) return;
    this.expenseService.delete(e.id).subscribe(() => this.refresh());
  }
}

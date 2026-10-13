import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { ResourceService } from '../../../core/services/resource.service';
import { InventoryItem } from '../../../core/models/domain.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule,
  ],
  templateUrl: './inventory.component.html',
})
export class InventoryComponent implements OnInit {
  items = signal<InventoryItem[]>([]);
  errorMessage = signal<string | null>(null);
  categories = ['cement', 'steel', 'bricks', 'sand', 'concrete', 'electrical', 'plumbing'];

  form: any;

  constructor(
    private fb: FormBuilder,
    private resourceService: ResourceService,
    public authService: AuthService
  ) {
    this.form = this.fb.group({
      material_name: ['', [Validators.required, Validators.minLength(2)]],
      category: ['cement', [Validators.required]],
      quantity: [0],
      unit: ['bags'],
      reorder_level: [0],
    });
  }

  ngOnInit(): void {
    this.fetch();
  }

  get canManage(): boolean {
    return this.authService.hasRole('admin', 'project_manager', 'site_engineer', 'contractor');
  }

  restock(item: InventoryItem, value: string): void {
    const qty = Number(value);
    if (isNaN(qty) || qty < 0) return;
    this.resourceService.updateInventoryItem(item.id, { quantity: qty }).subscribe(() => this.fetch());
  }

  lowCount(): number {
    return this.items().filter((i) => this.isLow(i)).length;
  }

  isLow(item: InventoryItem): boolean {
    return item.quantity <= item.reorder_level;
  }

  fetch(): void {
    this.resourceService.listInventory().subscribe((data) => this.items.set(data));
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.resourceService.createInventoryItem(this.form.getRawValue() as any).subscribe({
      next: () => {
        this.form.reset({ material_name: '', category: 'cement', quantity: 0, unit: 'bags', reorder_level: 0 });
        this.fetch();
      },
      error: (err) => this.errorMessage.set(err?.error?.detail || 'Could not add item.'),
    });
  }
}

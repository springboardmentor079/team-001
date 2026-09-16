import { Component } from '@angular/core';
import { ModulePlaceholderComponent } from '../../../shared/module-placeholder/module-placeholder.component';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [ModulePlaceholderComponent],
  template: `
    <app-module-placeholder
      icon="inventory_2"
      title="Materials & Inventory"
      description="Monitor material stock levels, requests and allocation."
      milestone="Milestone 3"
      table="inventory"
      [features]="features"
    />
  `,
})
export class InventoryComponent {
  features = ['Inventory monitoring', 'Material requests', 'Material allocation', 'Stock management with reorder levels', 'Categories: cement, steel, bricks, sand, concrete, electrical, plumbing'];
}

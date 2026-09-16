import { Component } from '@angular/core';
import { ModulePlaceholderComponent } from '../../../shared/module-placeholder/module-placeholder.component';

@Component({
  selector: 'app-procurement',
  standalone: true,
  imports: [ModulePlaceholderComponent],
  template: `
    <app-module-placeholder
      icon="shopping_cart"
      title="Procurement"
      description="Raise purchase requests and track vendors and deliveries."
      milestone="Milestone 3"
      table="procurements"
      [features]="features"
    />
  `,
})
export class ProcurementComponent {
  features = ['Vendor management', 'Purchase orders', 'Invoice tracking', 'Procurement requests', 'Supplier management'];
}

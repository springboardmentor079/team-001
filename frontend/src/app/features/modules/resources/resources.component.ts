import { Component } from '@angular/core';
import { ModulePlaceholderComponent } from '../../../shared/module-placeholder/module-placeholder.component';

@Component({
  selector: 'app-resources',
  standalone: true,
  imports: [ModulePlaceholderComponent],
  template: `
    <app-module-placeholder
      icon="precision_manufacturing"
      title="Machinery & Resources"
      description="Allocate equipment and machinery and monitor utilisation."
      milestone="Milestone 2"
      table="resources"
      [features]="features"
    />
  `,
})
export class ResourcesComponent {
  features = ['Equipment allocation', 'Machinery tracking', 'Resource utilisation', 'Availability calendar', 'Maintenance scheduling'];
}

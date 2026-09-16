import { Component } from '@angular/core';
import { ModulePlaceholderComponent } from '../../../shared/module-placeholder/module-placeholder.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [ModulePlaceholderComponent],
  template: `
    <app-module-placeholder
      icon="summarize"
      title="Reports & Documentation"
      description="Generate progress, budget and workforce reports."
      milestone="Milestone 3"
      table="reports"
      [features]="features"
    />
  `,
})
export class ReportsComponent {
  features = ['Project progress reports', 'Resource utilisation reports', 'Budget reports', 'Workforce reports', 'PDF and Excel export'];
}

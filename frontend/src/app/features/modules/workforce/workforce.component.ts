import { Component } from '@angular/core';
import { ModulePlaceholderComponent } from '../../../shared/module-placeholder/module-placeholder.component';

@Component({
  selector: 'app-workforce',
  standalone: true,
  imports: [ModulePlaceholderComponent],
  template: `
    <app-module-placeholder
      icon="groups"
      title="Workers & Attendance"
      description="Register workers, record attendance and manage shifts."
      milestone="Milestone 2"
      table="workers, attendance"
      [features]="features"
    />
  `,
})
export class WorkforceComponent {
  features = ['Worker registration', 'Attendance tracking', 'Workforce allocation', 'Shift scheduling', 'Payroll monitoring'];
}

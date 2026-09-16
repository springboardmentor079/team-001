import { Component } from '@angular/core';
import { ModulePlaceholderComponent } from '../../../shared/module-placeholder/module-placeholder.component';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [ModulePlaceholderComponent],
  template: `
    <app-module-placeholder
      icon="notifications"
      title="Notifications"
      description="System, project and deadline alerts for every role."
      milestone="Milestone 3"
      table="notifications"
      [features]="features"
    />
  `,
})
export class NotificationsComponent {
  features = ['Project updates', 'Task assignments', 'Procurement alerts', 'Attendance alerts', 'Deadline notifications'];
}

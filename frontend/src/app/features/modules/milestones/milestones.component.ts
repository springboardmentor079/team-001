import { Component } from '@angular/core';
import { ModulePlaceholderComponent } from '../../../shared/module-placeholder/module-placeholder.component';

@Component({
  selector: 'app-milestones',
  standalone: true,
  imports: [ModulePlaceholderComponent],
  template: `
    <app-module-placeholder
      icon="timeline"
      title="Milestones & Progress"
      description="Track site progress against planned milestones and report delays."
      milestone="Milestone 2"
      table="project_milestones"
      [features]="features"
    />
  `,
})
export class MilestonesComponent {
  features = ['Daily and weekly progress reports', 'Milestone tracking', 'Work completion status', 'Delay tracking', 'Site activity logs'];
}

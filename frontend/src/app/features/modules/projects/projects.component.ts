import { Component } from '@angular/core';
import { ModulePlaceholderComponent } from '../../../shared/module-placeholder/module-placeholder.component';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [ModulePlaceholderComponent],
  template: `
    <app-module-placeholder
      icon="business"
      title="Project Management"
      description="Create, schedule and track construction projects end to end."
      milestone="Milestone 2"
      table="projects"
      [features]="features"
    />
  `,
})
export class ProjectsComponent {
  features = ['Create and update projects', 'Project scheduling', 'Status tracking (planned, in progress, on hold, completed)', 'Categories: residential, commercial, industrial, infrastructure, government', 'Project closure'];
}

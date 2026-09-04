import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { map } from 'rxjs';

/**
 * Professional placeholder shown for sidebar routes that belong to a
 * future milestone (Milestones, Resources, Workforce, Site Progress,
 * Reports, Attendance). The module name is read from route data so a
 * single component serves every "coming soon" route.
 */
@Component({
  selector: 'app-coming-soon',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './coming-soon.component.html',
  styleUrl: './coming-soon.component.scss',
})
export class ComingSoonComponent {
  private route = inject(ActivatedRoute);

  moduleName$ = this.route.data.pipe(map((data) => (data['moduleName'] as string) ?? 'This module'));
}

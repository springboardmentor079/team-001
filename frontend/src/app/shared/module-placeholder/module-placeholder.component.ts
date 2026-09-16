import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-module-placeholder',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  templateUrl: './module-placeholder.component.html',
  styleUrl: './module-placeholder.component.css',
})
export class ModulePlaceholderComponent {
  @Input({ required: true }) icon = '';
  @Input({ required: true }) title = '';
  @Input({ required: true }) description = '';
  @Input({ required: true }) milestone = '';
  /** DB table backing this module — already created in Milestone 1 */
  @Input({ required: true }) table = '';
  /** Features planned for this module */
  @Input() features: string[] = [];
}

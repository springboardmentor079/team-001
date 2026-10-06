import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../core/icon.component';

@Component({
  selector: 'bt-landing',
  imports: [RouterLink, IconComponent],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
})
export class LandingComponent {
  readonly features = [
    { icon: 'building', title: 'Plan with confidence', text: 'Keep projects, milestones, dependencies and site progress aligned in one live workspace.' },
    { icon: 'users', title: 'Coordinate every team', text: 'Give administrators, managers, engineers, contractors, workers and clients the right view.' },
    { icon: 'activity', title: 'Control cost and supply', text: 'Connect inventory, procurement, invoices, expenses and forecasts to real project activity.' },
  ];
}

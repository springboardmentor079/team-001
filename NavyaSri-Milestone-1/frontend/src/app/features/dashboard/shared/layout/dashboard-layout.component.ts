import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable, map, shareReplay } from 'rxjs';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';
import { AuthService } from '../../../../core/services/auth.service';

/**
 * Shared authenticated-app shell: sticky top navbar + responsive side
 * navigation drawer + routed content area. Every dashboard/profile/
 * projects route renders inside this layout.
 */
@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, MatSidenavModule, NavbarComponent, SidebarComponent],
  templateUrl: './dashboard-layout.component.html',
  styleUrl: './dashboard-layout.component.scss',
})
export class DashboardLayoutComponent {
  private breakpointObserver = inject(BreakpointObserver);
  auth = inject(AuthService);

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
    map((result) => result.matches),
    shareReplay(),
  );
}

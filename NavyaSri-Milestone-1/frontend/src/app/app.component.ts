import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** Application root: hosts the router outlet. All layout is handled by
 * feature-level shells (auth pages render standalone; authenticated
 * pages render inside DashboardLayoutComponent). */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet></router-outlet>',
})
export class AppComponent {}

import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';

/** Shown when an authenticated user tries to access a route their role can't reach. */
@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule],
  templateUrl: './unauthorized.component.html',
  styleUrl: './unauthorized.component.scss',
})
export class UnauthorizedComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  goToMyDashboard(): void {
    if (this.auth.isAuthenticated) {
      this.auth.redirectToDashboard();
    } else {
      this.router.navigate(['/auth/login']);
    }
  }
}

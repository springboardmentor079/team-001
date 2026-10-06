import { Component, inject, signal, HostListener } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { IconComponent } from '../core/icon.component';
import { errorMessage, roleLabel } from '../core/models';
@Component({
  selector: 'bt-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, IconComponent],
  templateUrl: './shell.component.html',
})
export class ShellComponent {
  readonly auth = inject(AuthService);
  private router = inject(Router);
  readonly collapsed = signal(localStorage.getItem('bt_sidebar') === 'collapsed');
  readonly mobile = signal(false);
  readonly error = signal('');
  readonly signingOut = signal(false);
  readonly label = roleLabel;
  get initials() {
    return (
      this.auth
        .user()
        ?.name.split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('') || 'BT'
    );
  }
  get pageName() {
    if (this.router.url.startsWith('/ml-insights')) return 'ML insights';
    if (this.router.url.startsWith('/analytics')) return 'Analytics & insights';
    if (this.router.url.startsWith('/documents')) return 'Documents & reports';
    if (this.router.url.startsWith('/notifications')) return 'Notifications';
    if (this.router.url.startsWith('/finance')) return 'Budgets & expenses';
    if (this.router.url.startsWith('/procurement')) return 'Procurement';
    if (this.router.url.startsWith('/workforce')) return 'Workforce';
    if (this.router.url.startsWith('/inventory')) return 'Inventory';
    if (this.router.url.startsWith('/equipment')) return 'Resource & equipment';
    if (this.router.url.endsWith('/schedule')) return 'Project schedule';
    if (this.router.url.endsWith('/site')) return 'Site operations';
    if (this.router.url.startsWith('/projects')) return 'Projects';
    return (
      (
        {
          '/workspace': 'Workspace overview',
          '/profile': 'My profile',
          '/security': 'Security',
          '/users': 'Team directory',
        } as Record<string, string>
      )[this.router.url.split('?')[0]!] || 'Workspace'
    );
  }
  toggle() {
    if (window.innerWidth < 900) {
      this.mobile.update((v) => !v);
      return;
    }
    this.collapsed.update((v) => !v);
    localStorage.setItem('bt_sidebar', this.collapsed() ? 'collapsed' : 'expanded');
  }
  @HostListener('document:keydown.escape') closeMobile() {
    this.mobile.set(false);
  }
  logout() {
    this.signingOut.set(true);
    this.auth.logout().subscribe({
      next: () => void this.router.navigateByUrl('/login'),
      error: (e) => {
        this.error.set(errorMessage(e));
        this.signingOut.set(false);
      },
    });
  }
}

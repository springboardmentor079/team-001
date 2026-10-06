import { Component, inject, signal, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { IconComponent } from '../core/icon.component';
import { ApiResponse, errorMessage, roleLabel } from '../core/models';
interface SearchResult {
  id: string;
  category: string;
  title: string;
  metadata: string;
  route: string;
}
@Component({
  selector: 'bt-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, IconComponent, FormsModule],
  templateUrl: './shell.component.html',
})
export class ShellComponent {
  readonly auth = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient);
  readonly collapsed = signal(localStorage.getItem('bt_sidebar') === 'collapsed');
  readonly mobile = signal(false);
  readonly error = signal('');
  readonly signingOut = signal(false);
  readonly searchQuery = signal('');
  readonly searchResults = signal<SearchResult[]>([]);
  readonly searching = signal(false);
  readonly searchOpen = signal(false);
  private searchTimer?: ReturnType<typeof setTimeout>;
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
    this.searchOpen.set(false);
  }
  search(value: string) {
    this.searchQuery.set(value);
    if (this.searchTimer) clearTimeout(this.searchTimer);
    const query = value.trim();
    if (query.length < 2) {
      this.searchResults.set([]);
      this.searchOpen.set(false);
      return;
    }
    this.searchTimer = setTimeout(() => {
      this.searching.set(true);
      this.http
        .get<ApiResponse<SearchResult[]>>('/api/v1/search', { params: { q: query } })
        .subscribe({
          next: (response) => {
            this.searchResults.set(response.data);
            this.searchOpen.set(true);
            this.searching.set(false);
          },
          error: (e) => {
            this.error.set(errorMessage(e));
            this.searching.set(false);
          },
        });
    }, 250);
  }
  openResult(result: SearchResult) {
    this.searchOpen.set(false);
    this.searchQuery.set('');
    void this.router.navigateByUrl(result.route);
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

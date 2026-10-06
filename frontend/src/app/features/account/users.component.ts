import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ApiResponse, errorMessage, roleLabel } from '../../core/models';
interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  lastLoginAt: string | null;
}
@Component({
  selector: 'bt-users',
  imports: [ReactiveFormsModule, DatePipe],
  template: `<div class="page-heading">
      <div>
        <span class="eyebrow dark">ORGANIZATION</span>
        <h1>Team directory<span class="orange">.</span></h1>
        <p>People with access to your company workspace.</p>
      </div>
      <button class="btn primary" (click)="edit()" [disabled]="busy()">Add team member</button>
    </div>
    @if (message()) {
      <div class="notice success" role="status">{{ message() }}</div>
    }
    @if (editing()) {
      <section class="panel settings-form" aria-labelledby="member-heading">
        <h2 id="member-heading">{{ selected() ? 'Edit team member' : 'Add team member' }}</h2>
        <p>Role and access changes end this member's existing sessions.</p>
        <form [formGroup]="form" (ngSubmit)="save()">
          <div class="field">
            <label for="member-name">Full name</label
            ><input id="member-name" formControlName="name" autocomplete="off" />
          </div>
          <div class="field">
            <label for="member-email">Email address</label
            ><input id="member-email" type="email" formControlName="email" autocomplete="off" />
          </div>
          <div class="field">
            <label for="member-role">Role</label
            ><select id="member-role" formControlName="role">
              @for (role of roles; track role) {
                <option [value]="role">{{ label(role) }}</option>
              }
            </select>
          </div>
          @if (!selected()) {
            <div class="field">
              <label for="member-password">Initial password</label
              ><input
                id="member-password"
                type="password"
                formControlName="password"
                autocomplete="new-password"
              /><small class="field-help"
                >At least 12 characters with uppercase, lowercase and a number. Share securely with
                the member.</small
              >
            </div>
          } @else {
            <div class="field">
              <label for="member-active">Account access</label
              ><select id="member-active" formControlName="active">
                <option [ngValue]="true">Active</option>
                <option [ngValue]="false">Inactive</option>
              </select>
            </div>
          }
          <div class="member-actions">
            <button class="btn primary" [disabled]="busy()">
              {{ busy() ? 'Saving…' : 'Save member' }}</button
            ><button type="button" class="btn" (click)="editing.set(false)" [disabled]="busy()">
              Cancel
            </button>
          </div>
        </form>
      </section>
    }
    @if (error()) {
      <div class="notice error" role="alert">
        {{ error() }}<button class="text-button" (click)="load()">Try again</button>
      </div>
    }
    <form class="project-filters" [formGroup]="filter" (ngSubmit)="applyFilters()">
      <div class="field">
        <label for="team-search">Find a team member</label
        ><input id="team-search" formControlName="search" placeholder="Search by name or email" />
      </div>
      <div class="field">
        <label for="team-role">Role</label
        ><select id="team-role" formControlName="role">
          <option value="">All roles</option>
          @for (role of roles; track role) {
            <option [value]="role">{{ label(role) }}</option>
          }
        </select>
      </div>
      <div class="field">
        <label for="team-sort">Sort by</label
        ><select id="team-sort" formControlName="sort">
          <option value="name">Name</option>
          <option value="createdAt">Recently added</option>
          <option value="lastLoginAt">Last login</option>
        </select>
      </div>
      <button class="btn primary">Apply filters</button>
    </form>
    <section class="panel">
      @if (loading()) {
        <div class="skeleton" style="height:200px" aria-label="Loading team" aria-busy="true"></div>
      } @else {
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Team member</th>
                <th>Email</th>
                <th>Role</th>
                <th>Last login</th>
                <th>Status</th>
                <th>Manage</th>
              </tr>
            </thead>
            <tbody>
              @for (user of users(); track user.id) {
                <tr>
                  <td>
                    <strong>{{ user.name }}</strong>
                  </td>
                  <td>{{ user.email }}</td>
                  <td>{{ label(user.role) }}</td>
                  <td>
                    {{ user.lastLoginAt ? (user.lastLoginAt | date: 'medium') : 'Never signed in' }}
                  </td>
                  <td>
                    <span class="tag" [class.green-tag]="user.active">{{
                      user.active ? 'Active' : 'Inactive'
                    }}</span>
                  </td>
                  <td>
                    @if (user.id !== auth.user()?.id) {
                      <button
                        class="text-button"
                        (click)="edit(user)"
                        [disabled]="busy()"
                        [attr.aria-label]="'Edit ' + user.name"
                      >
                        Edit
                      </button>
                      @if (user.active) {
                        <button
                          class="text-button"
                          (click)="resetPassword(user)"
                          [disabled]="busy()"
                          [attr.aria-label]="'Reset password for ' + user.name"
                        >
                          Reset password
                        </button>
                      }
                    } @else {
                      <span class="field-help">Your account</span>
                    }
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6">No team members found.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="panel-foot">{{ total() }} team members in your organization.</div>
        @if (totalPages() > 1) {
          <div class="pagination">
            <button class="btn" [disabled]="page() === 1" (click)="changePage(page() - 1)">
              Previous</button
            ><span>Page {{ page() }} of {{ totalPages() }}</span
            ><button
              class="btn"
              [disabled]="page() === totalPages()"
              (click)="changePage(page() + 1)"
            >
              Next
            </button>
          </div>
        }
      }
    </section>`,
})
export class UsersComponent {
  private http = inject(HttpClient);
  readonly auth = inject(AuthService);
  private fb = inject(FormBuilder);
  readonly roles = [
    'ADMINISTRATOR',
    'PROJECT_MANAGER',
    'SITE_ENGINEER',
    'CONTRACTOR',
    'WORKER',
    'CLIENT',
  ];
  readonly editing = signal(false);
  readonly selected = signal<string | null>(null);
  readonly busy = signal(false);
  readonly message = signal('');
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
    email: ['', [Validators.required, Validators.email]],
    role: ['WORKER', Validators.required],
    active: [true],
    password: [''],
  });
  readonly filter = this.fb.nonNullable.group({ search: [''], role: [''], sort: ['name'] });
  readonly page = signal(1);
  readonly total = signal(0);
  readonly totalPages = signal(1);
  resetPassword(user: Member) {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    this.message.set('');
    this.http
      .post<ApiResponse<null>>('/api/v1/users/' + user.id + '/reset-password', {})
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: (r) => this.message.set(r.message),
        error: (e) => this.error.set(errorMessage(e)),
      });
  }
  edit(user?: Member) {
    this.selected.set(user?.id || null);
    this.form.reset({
      name: user?.name || '',
      email: user?.email || '',
      role: user?.role || 'WORKER',
      active: user?.active ?? true,
      password: '',
    });
    this.editing.set(true);
    this.error.set('');
    this.message.set('');
  }
  save() {
    if (this.busy()) return;
    this.error.set('');
    const value = this.form.getRawValue();
    if (
      this.form.invalid ||
      (!this.selected() &&
        (value.password.length < 12 ||
          !/[A-Z]/.test(value.password) ||
          !/[a-z]/.test(value.password) ||
          !/[0-9]/.test(value.password)))
    ) {
      this.error.set(
        'Enter a valid name, email and password (12 characters, uppercase, lowercase and a number).',
      );
      return;
    }
    this.busy.set(true);
    const common = { name: value.name, email: value.email, role: value.role };
    const request = this.selected()
      ? this.http.patch<ApiResponse<Member>>('/api/v1/users/' + this.selected(), {
          ...common,
          active: value.active,
        })
      : this.http.post<ApiResponse<Member>>('/api/v1/users', {
          ...common,
          password: value.password,
        });
    request.pipe(finalize(() => this.busy.set(false))).subscribe({
      next: () => {
        this.message.set(this.selected() ? 'Team member updated.' : 'Team member created.');
        this.editing.set(false);
        this.form.controls.password.reset();
        this.load();
      },
      error: (e) => this.error.set(errorMessage(e)),
    });
  }
  readonly users = signal<Member[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly label = roleLabel;
  constructor() {
    this.load();
  }
  load() {
    this.loading.set(true);
    this.error.set('');
    const filter = this.filter.getRawValue();
    let params = new HttpParams()
      .set('page', this.page())
      .set('limit', 20)
      .set('sort', filter.sort)
      .set('direction', filter.sort === 'name' ? 'asc' : 'desc');
    if (filter.search.trim()) params = params.set('search', filter.search.trim());
    if (filter.role) params = params.set('role', filter.role);
    this.http.get<ApiResponse<Member[]>>('/api/v1/users', { params }).subscribe({
      next: (r) => {
        this.users.set(r.data);
        this.total.set(r.meta?.total ?? r.data.length);
        this.totalPages.set(r.meta?.totalPages ?? 1);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(errorMessage(e));
        this.loading.set(false);
      },
    });
  }
  applyFilters() {
    this.page.set(1);
    this.load();
  }
  changePage(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.page.set(page);
    this.load();
  }
}

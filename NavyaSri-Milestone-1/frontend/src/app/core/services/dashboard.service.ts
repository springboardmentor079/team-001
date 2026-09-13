import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

/** Fetches the role-specific dashboard summary from the backend. */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private api = inject(ApiService);

  getAdminDashboard(): Observable<Record<string, unknown>> {
    return this.api.get('/dashboard/admin');
  }

  getProjectManagerDashboard(): Observable<Record<string, unknown>> {
    return this.api.get('/dashboard/project-manager');
  }

  getSiteEngineerDashboard(): Observable<Record<string, unknown>> {
    return this.api.get('/dashboard/site-engineer');
  }

  getContractorDashboard(): Observable<Record<string, unknown>> {
    return this.api.get('/dashboard/contractor');
  }

  getWorkerDashboard(): Observable<Record<string, unknown>> {
    return this.api.get('/dashboard/worker');
  }

  getClientDashboard(): Observable<Record<string, unknown>> {
    return this.api.get('/dashboard/client');
  }
}

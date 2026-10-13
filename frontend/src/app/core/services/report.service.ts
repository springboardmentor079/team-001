import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Analytics, ReportHistoryItem, ReportSummary } from '../models/domain.model';

export type ExportFormat = 'xlsx' | 'pdf' | 'csv';

@Injectable({ providedIn: 'root' })
export class ReportService {
  constructor(private http: HttpClient) {}

  getSummary(): Observable<ReportSummary> {
    return this.http.get<ReportSummary>(`${environment.apiUrl}/reports/summary`);
  }

  getAnalytics(): Observable<Analytics> {
    return this.http.get<Analytics>(`${environment.apiUrl}/reports/analytics`);
  }

  history(): Observable<ReportHistoryItem[]> {
    return this.http.get<ReportHistoryItem[]>(`${environment.apiUrl}/reports/history`);
  }

  export(kind: string, format: ExportFormat): Observable<HttpResponse<Blob>> {
    return this.http.get(`${environment.apiUrl}/reports/export/${kind}`, {
      params: { format },
      responseType: 'blob',
      observe: 'response',
    });
  }
}

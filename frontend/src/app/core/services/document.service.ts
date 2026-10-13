import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DocumentItem } from '../models/domain.model';

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private base = `${environment.apiUrl}/documents`;
  constructor(private http: HttpClient) {}

  list(): Observable<DocumentItem[]> {
    return this.http.get<DocumentItem[]>(`${this.base}/`);
  }

  upload(file: File, projectId: number | null): Observable<DocumentItem> {
    const form = new FormData();
    form.append('file', file);
    if (projectId) form.append('project_id', String(projectId));
    return this.http.post<DocumentItem>(`${this.base}/`, form);
  }

  download(id: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.base}/${id}/download`, { responseType: 'blob', observe: 'response' });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}

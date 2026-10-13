import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Milestone, Project } from '../models/domain.model';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private base = `${environment.apiUrl}/projects`;
  constructor(private http: HttpClient) {}

  list(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.base}/`);
  }
  create(payload: Partial<Project>): Observable<Project> {
    return this.http.post<Project>(`${this.base}/`, payload);
  }
  update(id: number, payload: Partial<Project>): Observable<Project> {
    return this.http.put<Project>(`${this.base}/${id}`, payload);
  }
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
  listMilestones(projectId: number): Observable<Milestone[]> {
    return this.http.get<Milestone[]>(`${this.base}/${projectId}/milestones`);
  }
  addMilestone(projectId: number, payload: Partial<Milestone>): Observable<Milestone> {
    return this.http.post<Milestone>(`${this.base}/${projectId}/milestones`, payload);
  }
  updateMilestone(milestoneId: number, payload: Partial<Milestone>): Observable<Milestone> {
    return this.http.patch<Milestone>(`${this.base}/milestones/${milestoneId}`, payload);
  }
}

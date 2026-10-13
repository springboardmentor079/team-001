import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Expense, ProjectBudget } from '../models/domain.model';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  constructor(private http: HttpClient) {}

  list(): Observable<Expense[]> {
    return this.http.get<Expense[]>(`${environment.apiUrl}/expenses`);
  }

  create(payload: Partial<Expense>): Observable<Expense> {
    return this.http.post<Expense>(`${environment.apiUrl}/expenses`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/expenses/${id}`);
  }

  overview(): Observable<ProjectBudget[]> {
    return this.http.get<ProjectBudget[]>(`${environment.apiUrl}/budget/overview`);
  }
}

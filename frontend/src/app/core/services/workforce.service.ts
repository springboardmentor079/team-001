import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AttendanceRecord, PayrollReport, Shift, Worker } from '../models/domain.model';

@Injectable({ providedIn: 'root' })
export class WorkforceService {
  constructor(private http: HttpClient) {}

  listWorkers(): Observable<Worker[]> {
    return this.http.get<Worker[]>(`${environment.apiUrl}/workers`);
  }
  createWorker(payload: Partial<Worker>): Observable<Worker> {
    return this.http.post<Worker>(`${environment.apiUrl}/workers`, payload);
  }
  deleteWorker(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/workers/${id}`);
  }
  markAttendance(payload: { worker_id: number; project_id: number; date: string; status: string }): Observable<AttendanceRecord> {
    return this.http.post<AttendanceRecord>(`${environment.apiUrl}/attendance`, payload);
  }
  listAttendance(): Observable<AttendanceRecord[]> {
    return this.http.get<AttendanceRecord[]>(`${environment.apiUrl}/attendance`);
  }

  listShifts(start: string, end: string): Observable<Shift[]> {
    return this.http.get<Shift[]>(`${environment.apiUrl}/shifts`, { params: { start, end } });
  }

  assignShift(payload: { worker_id: number; project_id: number; shift_date: string; shift_type: string }): Observable<Shift> {
    return this.http.post<Shift>(`${environment.apiUrl}/shifts`, payload);
  }

  deleteShift(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/shifts/${id}`);
  }

  payroll(start: string, end: string): Observable<PayrollReport> {
    return this.http.get<PayrollReport>(`${environment.apiUrl}/payroll`, { params: { start, end } });
  }
}

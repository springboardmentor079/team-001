import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProcurementRequest, Vendor, VendorSummary } from '../models/domain.model';

@Injectable({ providedIn: 'root' })
export class ProcurementService {
  private base = `${environment.apiUrl}/procurement`;
  constructor(private http: HttpClient) {}

  list(): Observable<ProcurementRequest[]> {
    return this.http.get<ProcurementRequest[]>(`${this.base}/`);
  }
  create(payload: Partial<ProcurementRequest>): Observable<ProcurementRequest> {
    return this.http.post<ProcurementRequest>(`${this.base}/`, payload);
  }
  updateStatus(id: number, status: string): Observable<ProcurementRequest> {
    return this.http.patch<ProcurementRequest>(`${this.base}/${id}`, { status });
  }

  updateInvoice(id: number, payload: { invoice_number?: string; invoice_paid?: boolean }): Observable<ProcurementRequest> {
    return this.http.patch<ProcurementRequest>(`${this.base}/${id}`, payload);
  }

  listVendors(): Observable<Vendor[]> {
    return this.http.get<Vendor[]>(`${environment.apiUrl}/vendors/`);
  }

  vendorSummary(): Observable<VendorSummary[]> {
    return this.http.get<VendorSummary[]>(`${environment.apiUrl}/vendors/summary`);
  }

  createVendor(payload: Partial<Vendor>): Observable<Vendor> {
    return this.http.post<Vendor>(`${environment.apiUrl}/vendors/`, payload);
  }

  deleteVendor(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/vendors/${id}`);
  }
}

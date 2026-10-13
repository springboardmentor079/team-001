import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { InventoryItem, ResourceItem } from '../models/domain.model';

@Injectable({ providedIn: 'root' })
export class ResourceService {
  constructor(private http: HttpClient) {}

  listResources(): Observable<ResourceItem[]> {
    return this.http.get<ResourceItem[]>(`${environment.apiUrl}/resources`);
  }
  createResource(payload: Partial<ResourceItem>): Observable<ResourceItem> {
    return this.http.post<ResourceItem>(`${environment.apiUrl}/resources`, payload);
  }
  updateResource(id: number, payload: Partial<ResourceItem>): Observable<ResourceItem> {
    return this.http.patch<ResourceItem>(`${environment.apiUrl}/resources/${id}`, payload);
  }
  listInventory(): Observable<InventoryItem[]> {
    return this.http.get<InventoryItem[]>(`${environment.apiUrl}/inventory`);
  }
  createInventoryItem(payload: Partial<InventoryItem>): Observable<InventoryItem> {
    return this.http.post<InventoryItem>(`${environment.apiUrl}/inventory`, payload);
  }
  updateInventoryItem(id: number, payload: Partial<InventoryItem>): Observable<InventoryItem> {
    return this.http.patch<InventoryItem>(`${environment.apiUrl}/inventory/${id}`, payload);
  }
}

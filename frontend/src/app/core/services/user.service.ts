import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DirectoryUser, } from '../models/domain.model';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private http: HttpClient) {}

  listAll(): Observable<User[]> {
    return this.http.get<User[]>(`${environment.apiUrl}/users/`);
  }

  directory(): Observable<DirectoryUser[]> {
    return this.http.get<DirectoryUser[]>(`${environment.apiUrl}/users/directory`);
  }

  update(id: number, payload: { role?: string; is_active?: boolean }): Observable<User> {
    return this.http.patch<User>(`${environment.apiUrl}/users/${id}`, payload);
  }
}

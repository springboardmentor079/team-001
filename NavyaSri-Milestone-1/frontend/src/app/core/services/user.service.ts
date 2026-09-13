import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';
import { ApiService } from './api.service';

export interface UserProfileUpdate {
  full_name?: string;
  phone_number?: string;
  profile_image?: string;
}

export interface UserListResult {
  total: number;
  items: User[];
}

/** User profile and (for admins) user-management API calls. */
@Injectable({ providedIn: 'root' })
export class UserService {
  private api = inject(ApiService);

  getMyProfile(): Observable<User> {
    return this.api.get<User>('/users/profile');
  }

  updateMyProfile(payload: UserProfileUpdate): Observable<User> {
    return this.api.put<User>('/users/profile', payload);
  }

  listUsers(params?: { role?: string; search?: string; skip?: number; limit?: number }): Observable<UserListResult> {
    return this.api.get<UserListResult>('/users', params);
  }

  getUser(id: number): Observable<User> {
    return this.api.get<User>(`/users/${id}`);
  }

  setUserActiveStatus(id: number, isActive: boolean): Observable<User> {
    return this.api.put<User>(`/users/${id}/status`, { is_active: isActive });
  }
}

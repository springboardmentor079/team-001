import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';

describe('Session renewal', () => {
  it('renews an expired access token before retrying a profile update', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    const auth = TestBed.inject(AuthService);
    const http = TestBed.inject(HttpTestingController);
    const user = {
      id: 'user-id',
      name: 'Priya',
      email: 'priya@example.com',
      permissions: ['PROFILE_EDIT'],
    };
    auth.login({ email: user.email, password: 'SecretPassword2026!', remember: false }).subscribe();
    http.expectOne('/api/v1/auth/login').flush({ data: { accessToken: 'expired', user } });
    const completed = vi.fn();
    auth.updateProfile({ name: 'Priya Updated', phone: '' }).subscribe(completed);
    http
      .expectOne('/api/v1/auth/me')
      .flush({ message: 'Expired' }, { status: 401, statusText: 'Unauthorized' });
    const refresh = http.expectOne('/api/v1/auth/refresh');
    expect(refresh.request.headers.get('X-BuildTrack-Client')).toBe('web');
    refresh.flush({ data: { accessToken: 'renewed', user } });
    const retried = http.expectOne('/api/v1/auth/me');
    expect(retried.request.headers.get('Authorization')).toBe('Bearer renewed');
    retried.flush({ data: { ...user, name: 'Priya Updated' } });
    expect(auth.user()?.name).toBe('Priya Updated');
    expect(completed).toHaveBeenCalledOnce();
    http.verify();
  });
});

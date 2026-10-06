import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  provideRouter,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { of, firstValueFrom, Observable } from 'rxjs';
import { authGuard, adminGuard } from './auth.guard';
import { AuthService } from './auth.service';
describe('Route protection', () => {
  const state = { url: '/profile' } as RouterStateSnapshot;
  it('redirects anonymous users and preserves their destination', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: AuthService, useValue: { restore: () => of(false) } },
      ],
    });
    const result = await firstValueFrom(
      TestBed.runInInjectionContext(() =>
        authGuard({} as ActivatedRouteSnapshot, state),
      ) as Observable<unknown>,
    );
    expect(TestBed.inject(Router).serializeUrl(result as ReturnType<Router['createUrlTree']>)).toBe(
      '/login?returnUrl=%2Fprofile',
    );
  });
  it('allows an authenticated session', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: AuthService, useValue: { restore: () => of(true) } },
      ],
    });
    expect(
      await firstValueFrom(
        TestBed.runInInjectionContext(() =>
          authGuard({} as ActivatedRouteSnapshot, state),
        ) as Observable<boolean>,
      ),
    ).toBe(true);
  });
  it('does not expose team administration to a client', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: AuthService, useValue: { user: () => ({ permissions: ['ACCOUNT_VIEW'] }) } },
      ],
    });
    const result = TestBed.runInInjectionContext(() =>
      adminGuard({} as ActivatedRouteSnapshot, state),
    );
    expect(TestBed.inject(Router).serializeUrl(result as ReturnType<Router['createUrlTree']>)).toBe(
      '/workspace',
    );
  });
});

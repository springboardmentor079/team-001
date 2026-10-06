import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api/v1/')) return next(req);
  const auth = inject(AuthService);
  const withToken = () => req.clone({ setHeaders: { Authorization: `Bearer ${auth.token()}` } });
  return next(withToken()).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401) return throwError(() => error);
      return auth
        .refresh()
        .pipe(switchMap((ok) => (ok ? next(withToken()) : throwError(() => error))));
    }),
  );
};

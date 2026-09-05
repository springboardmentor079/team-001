import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Functional HTTP interceptor that:
 *  1. Attaches the JWT bearer token to every outgoing API request.
 *  2. Logs the user out and redirects to /auth/login on a 401 response
 *     (expired/invalid token), except for the login/register calls
 *     themselves so a bad-password attempt doesn't wipe an existing
 *     session.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.token;
  const authorizedReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authorizedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthEndpoint = req.url.includes('/auth/login') || req.url.includes('/auth/register');
      if (error.status === 401 && !isAuthEndpoint) {
        auth.logout(false);
        router.navigate(['/auth/login']);
      }
      return throwError(() => error);
    }),
  );
};

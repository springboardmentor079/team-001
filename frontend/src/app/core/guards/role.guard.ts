import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Usage in routes: canActivate: [roleGuard], data: { roles: ['admin'] } */
export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const allowed: string[] = route.data?.['roles'] ?? [];
  if (allowed.length === 0 || auth.hasRole(...allowed)) return true;
  router.navigate(['/dashboard']);
  return false;
};

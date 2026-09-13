import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

/**
 * Restricts a route to specific roles, declared via route data:
 *
 *   { path: 'admin', canActivate: [roleGuard], data: { roles: [UserRole.ADMIN] } }
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const allowedRoles = (route.data['roles'] as UserRole[] | undefined) ?? [];
  const user = auth.currentUser;

  if (!user) {
    router.navigate(['/auth/login']);
    return false;
  }

  if (allowedRoles.length === 0 || allowedRoles.includes(user.role)) {
    return true;
  }

  router.navigate(['/unauthorized']);
  return false;
};

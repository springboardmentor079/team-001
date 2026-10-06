import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.restore().pipe(
    map((ok) => {
      if (!ok) return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
      if (auth.user()?.mustChangePassword && state.url !== '/security')
        return router.createUrlTree(['/security']);
      return true;
    }),
  );
};
export const adminGuard: CanActivateFn = () =>
  inject(AuthService).user()?.permissions.includes('USER_MANAGE') ||
  inject(Router).createUrlTree(['/workspace']);

export const projectGuard: CanActivateFn = () =>
  inject(AuthService).user()?.permissions.includes('PROJECT_VIEW') ||
  inject(Router).createUrlTree(['/workspace']);
export const resourceGuard: CanActivateFn = () =>
  inject(AuthService).user()?.permissions.includes('RESOURCE_VIEW') ||
  inject(Router).createUrlTree(['/workspace']);
export const inventoryGuard: CanActivateFn = () =>
  inject(AuthService).user()?.permissions.includes('INVENTORY_VIEW') ||
  inject(Router).createUrlTree(['/workspace']);
export const workforceGuard: CanActivateFn = () =>
  inject(AuthService).user()?.permissions.includes('WORKFORCE_VIEW') ||
  inject(Router).createUrlTree(['/workspace']);
export const procurementGuard: CanActivateFn = () =>
  inject(AuthService).user()?.permissions.includes('PROCUREMENT_VIEW') ||
  inject(Router).createUrlTree(['/workspace']);
export const financeGuard: CanActivateFn = () =>
  inject(AuthService).user()?.permissions.includes('BUDGET_VIEW') ||
  inject(Router).createUrlTree(['/workspace']);
export const documentGuard: CanActivateFn = () =>
  inject(AuthService).user()?.permissions.includes('DOCUMENT_VIEW') ||
  inject(Router).createUrlTree(['/workspace']);
export const analyticsGuard: CanActivateFn = () =>
  inject(AuthService).user()?.permissions.includes('REPORT_VIEW') ||
  inject(Router).createUrlTree(['/workspace']);

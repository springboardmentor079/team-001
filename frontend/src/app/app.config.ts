import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ErrorStateMatcher } from '@angular/material/core';
import { AbstractControl } from '@angular/forms';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

/**
 * Show a field's validation error only once the user has touched it (or we
 * explicitly called markAllAsTouched() on an invalid submit). The Material
 * default also keeps errors visible after a *successful* submit + reset,
 * which makes freshly cleared forms look broken.
 */
export class TouchedErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: AbstractControl | null): boolean {
    return !!(control && control.invalid && control.touched);
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(),
    { provide: ErrorStateMatcher, useClass: TouchedErrorStateMatcher },
  ],
};

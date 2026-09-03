import { HttpInterceptorFn } from '@angular/common/http';
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('buildtrack_token');
  return next(token && req.url.startsWith('/api/') ? req.clone({setHeaders: {Authorization: `Bearer ${token}`}}) : req);
};

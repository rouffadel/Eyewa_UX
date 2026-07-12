import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { AuthTokenStorage } from '../services/auth-token.storage';

const RETRY_HEADER = 'X-Retry-After-Refresh';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (isAuthExemptRequest(req.url)) {
    return next(req);
  }

  const tokenStorage = inject(AuthTokenStorage);
  const authService = inject(AuthService);
  const token = tokenStorage.getAccessToken();

  const authReq = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
    : req;

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (!shouldAttemptRefresh(error, req)) {
        return throwError(() => error);
      }

      return from(authService.refreshAccessToken()).pipe(
        switchMap((refreshed) => {
          if (!refreshed) {
            authService.handleSessionExpired();
            return throwError(() => error);
          }

          const newToken = tokenStorage.getAccessToken();
          if (!newToken) {
            authService.handleSessionExpired();
            return throwError(() => error);
          }

          return next(
            req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`,
                [RETRY_HEADER]: 'true',
              },
            }),
          );
        }),
      );
    }),
  );
};

function shouldAttemptRefresh(error: unknown, req: { url: string; headers: { has(name: string): boolean } }): boolean {
  if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
    return false;
  }

  if (req.headers.has(RETRY_HEADER) || isAuthExemptRequest(req.url)) {
    return false;
  }

  return true;
}

function isAuthExemptRequest(url: string): boolean {
  return /VerifyUserLogin|RefreshToken|\/config\//i.test(url);
}

import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from '../interceptors/auth.interceptor';
import { AuthTokenStorage } from '../services/auth-token.storage';
import { AuthService } from '../services/auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let tokenStorage: AuthTokenStorage;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', [
      'refreshAccessToken',
      'handleSessionExpired',
    ]);
    authService.refreshAccessToken.and.resolveTo(true);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authService },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    tokenStorage = TestBed.inject(AuthTokenStorage);
    tokenStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    tokenStorage.clear();
  });

  it('should attach bearer token to API requests', () => {
    tokenStorage.setTokens('abc123', 'refresh');

    http.get('/api/admin/FillStore').subscribe();

    const req = httpMock.expectOne('/api/admin/FillStore');
    expect(req.request.headers.get('Authorization')).toBe('Bearer abc123');
    req.flush({});
  });

  it('should not attach bearer token to login requests', () => {
    tokenStorage.setTokens('abc123', 'refresh');

    http.get('/api/auth/VerifyUserLogin?LoginName=x&Password=y').subscribe();

    const req = httpMock.expectOne('/api/auth/VerifyUserLogin?LoginName=x&Password=y');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('should not attach bearer token to config requests', () => {
    tokenStorage.setTokens('abc123', 'refresh');

    http.get('/config/appsettings.json').subscribe();

    const req = httpMock.expectOne('/config/appsettings.json');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('should refresh and retry once on 401', fakeAsync(() => {
    tokenStorage.setTokens('expired-token', 'refresh-token');
    authService.refreshAccessToken.and.callFake(async () => {
      tokenStorage.setTokens('fresh-token', 'refresh-token');
      return true;
    });

    let completed = false;
    http.get('/api/stores/FillStore').subscribe({
      next: () => {
        completed = true;
      },
    });

    const first = httpMock.expectOne('/api/stores/FillStore');
    first.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    tick();

    expect(authService.refreshAccessToken).toHaveBeenCalled();

    const retry = httpMock.expectOne('/api/stores/FillStore');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer fresh-token');
    expect(retry.request.headers.get('X-Retry-After-Refresh')).toBe('true');
    retry.flush({ ok: true });
    tick();

    expect(completed).toBeTrue();
    expect(authService.handleSessionExpired).not.toHaveBeenCalled();
  }));

  it('should handle session expiry when refresh fails', fakeAsync(() => {
    tokenStorage.setTokens('expired-token', 'refresh-token');
    authService.refreshAccessToken.and.resolveTo(false);

    let errored = false;
    http.get('/api/stores/FillStore').subscribe({
      error: (error: HttpErrorResponse) => {
        errored = error.status === 401;
      },
    });

    httpMock
      .expectOne('/api/stores/FillStore')
      .flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    tick();

    expect(authService.handleSessionExpired).toHaveBeenCalled();
    expect(errored).toBeTrue();
  }));
});

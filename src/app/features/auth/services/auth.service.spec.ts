import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AppConfigService } from '../../../services/app-config.service';
import { AuthService } from './auth.service';
import { AuthTokenStorage } from './auth-token.storage';
import { TokenRefreshService } from './token-refresh.service';
import { CustomerSessionService } from '../../pos/customer/services/customer-session.service';
import { LoginService } from './login.service';
import { StoreService } from './store.service';
import { AuthSession } from '../models/login-credentials';

describe('AuthService persistence', () => {
  const SESSION_KEY = 'eyewa_auth_session';
  let router: jasmine.SpyObj<Router>;

  const baseSession: AuthSession = {
    accessToken: 'stored-access-token',
    refreshToken: 'stored-refresh-token',
    displayName: 'Canada',
    user: {
      loginId: 1,
      loginName: 'CANADA',
      roleId: 1,
      storeId: 1,
      token: 'stored-access-token',
      refreshToken: 'stored-refresh-token',
      permissions: { view: true, add: true, edit: true, delete: true },
      status: '200',
      message: 'Success',
      qrcodeImg: null,
    },
  };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    router = jasmine.createSpyObj('Router', ['navigate']);
    router.navigate.and.resolveTo(true);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        AuthTokenStorage,
        { provide: Router, useValue: router },
        { provide: AppConfigService, useValue: { settings: { useMockAuth: true } } },
        { provide: LoginService, useValue: {} },
        { provide: StoreService, useValue: {} },
        { provide: TokenRefreshService, useValue: { refresh: jasmine.createSpy('refresh') } },
        { provide: CustomerSessionService, useValue: { clear: jasmine.createSpy('clear') } },
      ],
    });
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.inject(AuthTokenStorage).clear();
  });

  it('should restore session from localStorage after app restart', () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(baseSession));

    const auth = TestBed.inject(AuthService);

    expect(auth.isAuthenticated()).toBeTrue();
    expect(auth.user()?.loginName).toBe('CANADA');
    expect(TestBed.inject(AuthTokenStorage).getAccessToken()).toBe('stored-access-token');
  });

  it('should migrate legacy sessionStorage sessions to localStorage', () => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(baseSession));

    const auth = TestBed.inject(AuthService);

    expect(auth.isAuthenticated()).toBeTrue();
    expect(localStorage.getItem(SESSION_KEY)).toContain('CANADA');
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('should clear persisted session only on manual logout', () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(baseSession));
    TestBed.inject(AuthTokenStorage).setTokens('stored-access-token', 'stored-refresh-token');

    const auth = TestBed.inject(AuthService);
    expect(auth.isAuthenticated()).toBeTrue();

    auth.logout();

    expect(auth.isAuthenticated()).toBeFalse();
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(TestBed.inject(AuthTokenStorage).getAccessToken()).toBeNull();
  });

  it('should refresh and persist new tokens', async () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(baseSession));
    TestBed.inject(AuthTokenStorage).setTokens('expired-access', 'stored-refresh-token');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        AuthTokenStorage,
        { provide: Router, useValue: router },
        {
          provide: AppConfigService,
          useValue: {
            settings: {
              apiUrl: 'https://localhost:7207/api',
              useMockAuth: false,
            },
          },
        },
        { provide: LoginService, useValue: {} },
        { provide: StoreService, useValue: {} },
        { provide: TokenRefreshService, useValue: { refresh: jasmine.createSpy('refresh') } },
        { provide: CustomerSessionService, useValue: { clear: jasmine.createSpy('clear') } },
      ],
    });

    const refreshService = TestBed.inject(TokenRefreshService) as unknown as {
      refresh: jasmine.Spy;
    };
    refreshService.refresh.and.resolveTo({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });

    const auth = TestBed.inject(AuthService);
    await expectAsync(auth.refreshAccessToken()).toBeResolvedTo(true);

    expect(auth.isAuthenticated()).toBeTrue();
    expect(TestBed.inject(AuthTokenStorage).getAccessToken()).toBe('new-access-token');
    expect(JSON.parse(localStorage.getItem(SESSION_KEY)!).accessToken).toBe('new-access-token');
  });

  it('should alert and redirect to login when refresh token expires', async () => {
    spyOn(window, 'alert');
    localStorage.setItem(SESSION_KEY, JSON.stringify(baseSession));
    TestBed.inject(AuthTokenStorage).setTokens('expired-access', 'stored-refresh-token');

    TestBed.resetTestingModule();
    router = jasmine.createSpyObj('Router', ['navigate']);
    router.navigate.and.resolveTo(true);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        AuthTokenStorage,
        { provide: Router, useValue: router },
        {
          provide: AppConfigService,
          useValue: {
            settings: {
              apiUrl: 'https://localhost:7207/api',
              useMockAuth: false,
            },
          },
        },
        { provide: LoginService, useValue: {} },
        { provide: StoreService, useValue: {} },
        { provide: TokenRefreshService, useValue: { refresh: jasmine.createSpy('refresh') } },
        { provide: CustomerSessionService, useValue: { clear: jasmine.createSpy('clear') } },
      ],
    });

    const refreshService = TestBed.inject(TokenRefreshService) as unknown as {
      refresh: jasmine.Spy;
    };
    refreshService.refresh.and.rejectWith(new Error('Session expired. Please sign in again.'));

    const auth = TestBed.inject(AuthService);
    await expectAsync(auth.refreshAccessToken()).toBeResolvedTo(false);

    expect(window.alert).toHaveBeenCalledWith('Refresh token expired. Please login again.');
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    expect(auth.isAuthenticated()).toBeFalse();
  });
});

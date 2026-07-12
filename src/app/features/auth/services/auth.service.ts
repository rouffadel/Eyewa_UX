import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AppConfigService } from '../../../services/app-config.service';
import {
  AuthPermission,
  AuthSession,
  LoginCredentials,
} from '../models/login-credentials';
import {
  LOGIN_ERROR_MESSAGES,
  LoginError,
  LoginErrorCode,
} from '../models/login.error';
import { StoreOption } from '../models/store.models';
import { LoginService } from './login.service';
import { StoreService } from './store.service';
import { AuthTokenStorage } from './auth-token.storage';
import { TokenRefreshService } from './token-refresh.service';
import { CustomerSessionService } from '../../pos/customer/services/customer-session.service';
import { isJwtExpired } from '../utils/jwt.utils';

const SESSION_KEY = 'eyewa_auth_session';
const SESSION_EXPIRED_MESSAGE = 'Refresh token expired. Please login again.';
const MOCK_CREDENTIALS = { identifier: 'staff@eyewa.com', password: 'demo1234' };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly appConfig = inject(AppConfigService);
  private readonly loginService = inject(LoginService);
  private readonly storeService = inject(StoreService);
  private readonly tokenStorage = inject(AuthTokenStorage);
  private readonly tokenRefreshService = inject(TokenRefreshService);
  private readonly customerSession = inject(CustomerSessionService);
  private readonly router = inject(Router);

  private refreshInFlight: Promise<boolean> | null = null;
  private sessionExpiryNotified = false;

  private readonly session = signal<AuthSession | null>(null);

  readonly currentSession = this.session.asReadonly();
  readonly user = computed(() => this.session()?.user ?? null);
  readonly permissions = computed(() => this.session()?.user.permissions ?? null);
  readonly selectedStore = computed(() => this.session()?.selectedStore ?? null);

  constructor() {
    const session = this.readStoredSession();
    this.session.set(session);

    if (session && this.isTokenRefreshConfigured()) {
      void this.refreshAccessTokenIfNeeded();
    }
  }

  isAuthenticated(): boolean {
    return this.session() !== null && !!this.resolveAccessToken(this.session());
  }

  hasPermission(permission: AuthPermission): boolean {
    return this.session()?.user.permissions[permission] ?? false;
  }

  selectStore(store: StoreOption): void {
    const session = this.session();
    if (!session) {
      return;
    }

    const updated: AuthSession = {
      ...session,
      selectedStore: store,
      user: {
        ...session.user,
        storeId: store.storeId,
      },
    };

    this.session.set(updated);
    this.persistSession(updated);
  }

  login(credentials: LoginCredentials): Promise<void> {
    if (this.appConfig.settings?.useMockAuth) {
      return this.mockLogin(credentials);
    }

    return this.apiLogin(credentials);
  }

  logout(): void {
    this.refreshInFlight = null;
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
    this.tokenStorage.clear();
    this.customerSession.clear();
    this.session.set(null);
  }

  handleSessionExpired(): void {
    if (this.sessionExpiryNotified) {
      return;
    }

    this.sessionExpiryNotified = true;
    this.logout();
    window.alert(SESSION_EXPIRED_MESSAGE);
    void this.router.navigate(['/login']);
  }

  refreshAccessTokenIfNeeded(): Promise<boolean> {
    const accessToken = this.resolveAccessToken(this.session());
    if (accessToken && !isJwtExpired(accessToken)) {
      return Promise.resolve(true);
    }

    return this.refreshAccessToken();
  }

  refreshAccessToken(): Promise<boolean> {
    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }

    const refreshToken =
      this.tokenStorage.getRefreshToken() ??
      this.session()?.refreshToken ??
      this.session()?.user.refreshToken;

    if (!refreshToken || !this.isTokenRefreshConfigured()) {
      return Promise.resolve(false);
    }

    try {
      this.refreshInFlight = this.tokenRefreshService
        .refresh(refreshToken)
        .then((result) => {
          const session = this.session();
          if (!session) {
            return false;
          }

          this.applySession({
            ...session,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken || refreshToken,
            user: {
              ...session.user,
              token: result.accessToken,
              refreshToken: result.refreshToken || refreshToken,
            },
          });

          return true;
        })
        .catch(() => {
          if (this.session()) {
            this.handleSessionExpired();
          }

          return false;
        })
        .finally(() => {
          this.refreshInFlight = null;
        });
    } catch {
      return Promise.resolve(false);
    }

    return this.refreshInFlight;
  }

  private mockLogin(credentials: LoginCredentials): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const valid =
          credentials.identifier === MOCK_CREDENTIALS.identifier &&
          credentials.password === MOCK_CREDENTIALS.password;

        if (!valid) {
          reject(
            new LoginError(
              LoginErrorCode.InvalidCredentials,
              LOGIN_ERROR_MESSAGES[LoginErrorCode.InvalidCredentials],
            ),
          );
          return;
        }

        const authSession: AuthSession = {
          accessToken: 'mock-token',
          refreshToken: 'mock-refresh-token',
          displayName: 'Ameer',
          user: {
            loginId: 1,
            loginName: 'AMEER',
            roleId: 1,
            storeId: 1,
            token: 'mock-token',
            refreshToken: 'mock-refresh-token',
            permissions: { view: true, add: true, edit: true, delete: true },
            status: '200',
            message: 'Success',
            qrcodeImg: null,
          },
          selectedStore: { storeId: 1, storeName: 'Naimat Al Basar' },
          branchName: 'Main Branch',
          loyaltyPoints: 250,
        };

        this.applySession(authSession);
        resolve();
      }, 600);
    });
  }

  private apiLogin(credentials: LoginCredentials): Promise<void> {
    return this.loginService
      .verifyUserLogin(credentials.identifier, credentials.password)
      .then(async (user) => {
        const authSession: AuthSession = {
          accessToken: user.token,
          refreshToken: user.refreshToken,
          displayName: user.loginName,
          user,
        };

        this.applySession(authSession);

        await this.loadAndSelectStore(user.loginId, user.storeId);
      });
  }

  private applySession(authSession: AuthSession): void {
    this.sessionExpiryNotified = false;
    this.tokenStorage.setTokens(authSession.accessToken, authSession.refreshToken);
    this.persistSession(authSession);
    this.session.set(authSession);
  }

  private async loadAndSelectStore(loginId: number, storeId: number): Promise<void> {
    try {
      const stores = await this.storeService.fillStores(loginId, 0);
      if (stores.length === 0) {
        return;
      }

      const match =
        storeId > 0 ? stores.find((store) => store.storeId === storeId) : undefined;

      this.selectStore(match ?? stores[0]);
    } catch {
      // Store list can be retried from the header dropdown.
    }
  }

  private persistSession(session: AuthSession): void {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  private readStoredSession(): AuthSession | null {
    const raw = this.readRawSession();

    if (!raw) {
      return null;
    }

    try {
      const session = JSON.parse(raw) as AuthSession;
      if (!session?.user) {
        return null;
      }

      const accessToken = this.resolveAccessToken(session);
      const refreshToken =
        this.tokenStorage.getRefreshToken() ?? session.refreshToken ?? session.user.refreshToken ?? '';

      if (!accessToken) {
        return null;
      }

      if (!this.tokenStorage.getAccessToken()) {
        this.tokenStorage.setTokens(accessToken, refreshToken);
      }

      return {
        ...session,
        accessToken,
        refreshToken,
      };
    } catch {
      return null;
    }
  }

  private readRawSession(): string | null {
    const persistent = localStorage.getItem(SESSION_KEY);
    if (persistent) {
      return persistent;
    }

    const legacy = sessionStorage.getItem(SESSION_KEY);
    if (!legacy) {
      return null;
    }

    localStorage.setItem(SESSION_KEY, legacy);
    sessionStorage.removeItem(SESSION_KEY);
    return legacy;
  }

  private isTokenRefreshConfigured(): boolean {
    if (this.appConfig.settings?.useMockAuth) {
      return false;
    }

    return !!this.appConfig.settings?.apiUrl;
  }

  private resolveAccessToken(session: AuthSession | null): string | null {
    if (!session) {
      return null;
    }

    return (
      this.tokenStorage.getAccessToken() ||
      session.accessToken ||
      session.user.token ||
      null
    );
  }
}

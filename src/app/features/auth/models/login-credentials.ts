import type { VerifyUserLoginResult } from './login-api.models';
import type { StoreOption } from './store.models';

export interface LoginCredentials {
  identifier: string;
  password: string;
  rememberMe: boolean;
}

export type AuthPermission = keyof AuthPermissions;

export interface AuthPermissions {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
}

/** Persisted staff session — inject `AuthService` anywhere to read `currentSession()` / `user()`. */
export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  displayName: string;
  user: VerifyUserLoginResult;
  selectedStore?: StoreOption;
  branchName?: string;
  loyaltyPoints?: number;
}

import { Injectable } from '@angular/core';

const ACCESS_TOKEN_COOKIE = 'eyewa_access_token';
const REFRESH_TOKEN_COOKIE = 'eyewa_refresh_token';
/** Keep staff signed in on mobile/tablet until manual logout. */
const PERSISTENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

@Injectable({ providedIn: 'root' })
export class AuthTokenStorage {
  setTokens(accessToken: string, refreshToken: string, persistent = true): void {
    const maxAge = persistent ? PERSISTENT_MAX_AGE_SECONDS : undefined;
    this.setCookie(ACCESS_TOKEN_COOKIE, accessToken, maxAge);
    this.setCookie(REFRESH_TOKEN_COOKIE, refreshToken, maxAge);
  }

  getAccessToken(): string | null {
    return this.getCookie(ACCESS_TOKEN_COOKIE);
  }

  getRefreshToken(): string | null {
    return this.getCookie(REFRESH_TOKEN_COOKIE);
  }

  clear(): void {
    this.deleteCookie(ACCESS_TOKEN_COOKIE);
    this.deleteCookie(REFRESH_TOKEN_COOKIE);
  }

  private setCookie(name: string, value: string, maxAgeSeconds?: number): void {
    const encodedName = encodeURIComponent(name);
    const encodedValue = encodeURIComponent(value);
    let cookie = `${encodedName}=${encodedValue}; path=/; SameSite=Lax`;

    if (maxAgeSeconds != null) {
      cookie += `; max-age=${maxAgeSeconds}`;
    }

    if (typeof document !== 'undefined' && document.location.protocol === 'https:') {
      cookie += '; Secure';
    }

    document.cookie = cookie;
  }

  private getCookie(name: string): string | null {
    if (typeof document === 'undefined') {
      return null;
    }

    const encodedName = `${encodeURIComponent(name)}=`;
    const parts = document.cookie.split(';');

    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.startsWith(encodedName)) {
        return decodeURIComponent(trimmed.slice(encodedName.length));
      }
    }

    return null;
  }

  private deleteCookie(name: string): void {
    const encodedName = encodeURIComponent(name);
    document.cookie = `${encodedName}=; path=/; max-age=0; SameSite=Lax`;
  }
}

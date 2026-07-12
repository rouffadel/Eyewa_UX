import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppConfigService } from '../../../services/app-config.service';
import {
  RefreshTokenRequest,
  RefreshTokenResponse,
  RefreshTokenResult,
} from '../models/refresh-token.models';

@Injectable({ providedIn: 'root' })
export class TokenRefreshService {
  constructor(
    private readonly http: HttpClient,
    private readonly appConfig: AppConfigService,
  ) {}

  refresh(refreshToken: string): Promise<RefreshTokenResult> {
    const url = this.buildUrl();
    const body: RefreshTokenRequest = { token: refreshToken };

    return firstValueFrom(this.http.post<RefreshTokenResponse>(url, body))
      .then((response) => this.mapResponse(response))
      .catch((error: unknown) => {
        throw this.toError(error);
      });
  }

  private buildUrl(): string {
    const settings = this.appConfig.settings;
    const apiUrl = settings?.apiUrl?.replace(/\/$/, '');
    const refreshPath = settings?.authRefreshPath ?? 'auth/RefreshToken';

    if (!apiUrl) {
      throw new Error('Token refresh is not configured.');
    }

    return `${apiUrl}/${refreshPath}`;
  }

  private mapResponse(response: RefreshTokenResponse): RefreshTokenResult {
    if (response.status && response.status !== '200') {
      throw new Error(response.message || 'Unable to refresh session.');
    }

    const accessToken = response.objresult?.token?.trim();
    if (!accessToken) {
      throw new Error('Unable to refresh session.');
    }

    return {
      accessToken,
      refreshToken: response.objresult?.refreshToken?.trim() ?? '',
    };
  }

  private toError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }

    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return new Error('Unable to reach the server. Check your connection and try again.');
      }

      if (error.status === 401 || error.status === 403) {
        return new Error('Session expired. Please sign in again.');
      }

      return new Error('Unable to refresh session. Please sign in again.');
    }

    return new Error('Unable to refresh session. Please sign in again.');
  }
}

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppConfigService } from '../../../services/app-config.service';
import {
  VerifyUserLoginResponse,
  VerifyUserLoginResult,
  VerifyUserLoginUser,
} from '../models/login-api.models';
import {
  LOGIN_ERROR_MESSAGES,
  LoginError,
  LoginErrorCode,
} from '../models/login.error';

@Injectable({ providedIn: 'root' })
export class LoginService {
  constructor(
    private readonly http: HttpClient,
    private readonly appConfig: AppConfigService,
  ) {}

  verifyUserLogin(loginName: string, password: string): Promise<VerifyUserLoginResult> {
    let url: string;

    try {
      url = this.buildLoginUrl(loginName, password);
    } catch (error) {
      return Promise.reject(error);
    }

    return firstValueFrom(this.http.get<VerifyUserLoginResponse>(url))
      .then((response) => this.mapResponse(response))
      .catch((error: unknown) => {
        throw this.toLoginError(error);
      });
  }

  private buildLoginUrl(loginName: string, password: string): string {
    const settings = this.appConfig.settings;
    const apiUrl = settings?.apiUrl?.replace(/\/$/, '');
    const loginPath = settings?.authLoginPath ?? 'admin/VerifyUserLogin';

    if (!apiUrl) {
      throw new LoginError(
        LoginErrorCode.Configuration,
        LOGIN_ERROR_MESSAGES[LoginErrorCode.Configuration],
      );
    }

    const params = new URLSearchParams({
      LoginName: loginName.trim(),
      Password: password,
    });

    return `${apiUrl}/${loginPath}?${params.toString()}`;
  }

  private mapResponse(response: VerifyUserLoginResponse): VerifyUserLoginResult {
    if (response.status && response.status !== '200') {
      throw new LoginError(
        LoginErrorCode.InvalidCredentials,
        LOGIN_ERROR_MESSAGES[LoginErrorCode.InvalidCredentials],
      );
    }

    const parsed = this.parseUserResult(response);
    if (!parsed) {
      throw new LoginError(
        LoginErrorCode.InvalidCredentials,
        LOGIN_ERROR_MESSAGES[LoginErrorCode.InvalidCredentials],
      );
    }

    const token = response.objresult?.token?.trim();
    if (!token) {
      throw new LoginError(
        LoginErrorCode.InvalidCredentials,
        LOGIN_ERROR_MESSAGES[LoginErrorCode.InvalidCredentials],
      );
    }

    return {
      loginId: parsed.loginId,
      loginName: parsed.loginName,
      roleId: parsed.roleId,
      storeId: parsed.storeId,
      token,
      refreshToken: response.objresult?.refreshToken ?? '',
      permissions: {
        view: response.objresult.view,
        add: response.objresult.add,
        edit: response.objresult.edit,
        delete: response.objresult.delete,
      },
      status: response.status,
      message: response.message,
      qrcodeImg: response.qrcodeimg,
    };
  }

  private parseUserResult(
    response: VerifyUserLoginResponse,
  ): { loginId: number; loginName: string; roleId: number; storeId: number } | null {
    const result = response?.objresult?.result;
    if (!result) {
      return null;
    }

    if ('table' in result) {
      const row = result.table?.[0];
      return row?.loginID
        ? {
            loginId: row.loginID,
            loginName: row.loginName,
            roleId: row.roleId,
            storeId: row.storeID,
          }
        : null;
    }

    const user = result as VerifyUserLoginUser;
    if (!user.loginID || !user.userName) {
      return null;
    }

    return {
      loginId: user.loginID,
      loginName: user.userName,
      roleId: user.roleID,
      storeId: user.storeID,
    };
  }

  private toLoginError(error: unknown): LoginError {
    if (error instanceof LoginError) {
      return error;
    }

    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return new LoginError(
          LoginErrorCode.Network,
          LOGIN_ERROR_MESSAGES[LoginErrorCode.Network],
          { cause: error },
        );
      }

      if (error.status >= 500) {
        return new LoginError(
          LoginErrorCode.Server,
          LOGIN_ERROR_MESSAGES[LoginErrorCode.Server],
          { cause: error },
        );
      }

      return new LoginError(
        LoginErrorCode.InvalidCredentials,
        LOGIN_ERROR_MESSAGES[LoginErrorCode.InvalidCredentials],
        { cause: error },
      );
    }

    return new LoginError(
      LoginErrorCode.Unexpected,
      LOGIN_ERROR_MESSAGES[LoginErrorCode.Unexpected],
      { cause: error },
    );
  }
}

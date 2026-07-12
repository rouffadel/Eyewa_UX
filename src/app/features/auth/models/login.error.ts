export enum LoginErrorCode {
  InvalidCredentials = 'invalid_credentials',
  Network = 'network',
  Server = 'server',
  Configuration = 'configuration',
  Unexpected = 'unexpected',
}

export class LoginError extends Error {
  readonly code: LoginErrorCode;

  constructor(code: LoginErrorCode, userMessage: string, options?: ErrorOptions) {
    super(userMessage, options);
    this.name = 'LoginError';
    this.code = code;
  }
}

export const LOGIN_ERROR_MESSAGES: Record<LoginErrorCode, string> = {
  [LoginErrorCode.InvalidCredentials]:
    'Invalid username or password. Please try again.',
  [LoginErrorCode.Network]:
    'Unable to reach the server. Check your connection and try again.',
  [LoginErrorCode.Server]: 'Something went wrong. Please try again later.',
  [LoginErrorCode.Configuration]:
    'Login is not configured. Contact your administrator.',
  [LoginErrorCode.Unexpected]: 'Something went wrong. Please try again.',
};

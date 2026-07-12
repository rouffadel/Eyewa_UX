export interface RefreshTokenRequest {
  token: string;
}

export interface RefreshTokenResponse {
  status: string;
  message: string;
  objresult: {
    token?: string;
    refreshToken?: string;
  };
  qrcodeimg: string | null;
}

export interface RefreshTokenResult {
  accessToken: string;
  refreshToken: string;
}

/** Current API shape — `objresult.result` is a single user object. */
export interface VerifyUserLoginUser {
  loginID: number;
  roleID: number;
  userName: string;
  storeID: number;
}

/** Legacy API shape — kept for backward-compatible parsing. */
export interface VerifyUserLoginRow {
  loginID: number;
  loginName: string;
  password: string;
  roleId: number;
  storeID: number;
  fileName: string | null;
}

export interface VerifyUserLoginResponse {
  status: string;
  message: string;
  objresult: {
    result:
      | VerifyUserLoginUser
      | {
          table: VerifyUserLoginRow[];
        };
    view: boolean;
    add: boolean;
    edit: boolean;
    delete: boolean;
    token?: string;
    refreshToken?: string;
  };
  qrcodeimg: string | null;
}

export interface VerifyUserLoginResult {
  loginId: number;
  loginName: string;
  roleId: number;
  storeId: number;
  token: string;
  refreshToken: string;
  permissions: {
    view: boolean;
    add: boolean;
    edit: boolean;
    delete: boolean;
  };
  status: string;
  message: string;
  qrcodeImg: string | null;
}

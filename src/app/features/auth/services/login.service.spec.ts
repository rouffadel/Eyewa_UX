import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { AppConfigService } from '../../../services/app-config.service';
import { LoginError, LoginErrorCode } from '../models/login.error';
import { LoginService } from './login.service';

describe('LoginService', () => {
  let service: LoginService;
  let httpMock: HttpTestingController;

  const appConfigStub = {
    settings: {
      apiUrl: 'https://localhost:7207/api',
      authLoginPath: 'auth/VerifyUserLogin',
    },
  };

  const successResponse = {
    status: '200',
    message: 'Success',
    objresult: {
      result: {
        loginID: 1,
        roleID: 1,
        userName: 'CANADA',
        storeID: 0,
      },
      view: true,
      add: true,
      edit: true,
      delete: true,
      token: 'jwt-access-token',
      refreshToken: 'refresh-token-value',
    },
    qrcodeimg: null,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: AppConfigService, useValue: appConfigStub }],
    });

    service = TestBed.inject(LoginService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should verify login and map a successful response', async () => {
    const promise = service.verifyUserLogin('Canada', 'a1b2c3d4');

    const req = httpMock.expectOne(
      'https://localhost:7207/api/auth/VerifyUserLogin?LoginName=Canada&Password=a1b2c3d4',
    );
    expect(req.request.method).toBe('GET');

    req.flush(successResponse);

    await expectAsync(promise).toBeResolvedTo({
      loginId: 1,
      loginName: 'CANADA',
      roleId: 1,
      storeId: 0,
      token: 'jwt-access-token',
      refreshToken: 'refresh-token-value',
      permissions: {
        view: true,
        add: true,
        edit: true,
        delete: true,
      },
      status: '200',
      message: 'Success',
      qrcodeImg: null,
    });
  });

  it('should support the legacy table response shape', async () => {
    const promise = service.verifyUserLogin('Canada', 'a1b2c3d4');

    httpMock
      .expectOne(
        'https://localhost:7207/api/auth/VerifyUserLogin?LoginName=Canada&Password=a1b2c3d4',
      )
      .flush({
        status: '200',
        message: 'Success',
        objresult: {
          result: {
            table: [
              {
                loginID: 2,
                loginName: 'LEGACY',
                password: 'secret',
                roleId: 1,
                storeID: 3,
                fileName: null,
              },
            ],
          },
          view: true,
          add: false,
          edit: false,
          delete: false,
          token: 'legacy-token',
          refreshToken: 'legacy-refresh',
        },
        qrcodeimg: null,
      });

    await expectAsync(promise).toBeResolvedTo(
      jasmine.objectContaining({
        loginId: 2,
        loginName: 'LEGACY',
        storeId: 3,
        token: 'legacy-token',
      }),
    );
  });

  it('should reject empty login result as invalid credentials', async () => {
    const promise = service.verifyUserLogin('bad', 'wrong');

    httpMock
      .expectOne(
        'https://localhost:7207/api/auth/VerifyUserLogin?LoginName=bad&Password=wrong',
      )
      .flush({
        status: '200',
        message: 'Success',
        objresult: {
          result: { table: [] },
          view: false,
          add: false,
          edit: false,
          delete: false,
        },
        qrcodeimg: null,
      });

    await expectAsync(promise).toBeRejectedWith(
      jasmine.objectContaining<Partial<LoginError>>({
        code: LoginErrorCode.InvalidCredentials,
      }),
    );
  });

  it('should reject successful login without token', async () => {
    const promise = service.verifyUserLogin('Canada', 'a1b2c3d4');

    httpMock
      .expectOne(
        'https://localhost:7207/api/auth/VerifyUserLogin?LoginName=Canada&Password=a1b2c3d4',
      )
      .flush({
        ...successResponse,
        objresult: {
          ...successResponse.objresult,
          token: '',
        },
      });

    await expectAsync(promise).toBeRejectedWith(
      jasmine.objectContaining<Partial<LoginError>>({
        code: LoginErrorCode.InvalidCredentials,
      }),
    );
  });

  it('should map network failures to a network error', async () => {
    const promise = service.verifyUserLogin('Canada', 'a1b2c3d4');

    httpMock
      .expectOne(
        'https://localhost:7207/api/auth/VerifyUserLogin?LoginName=Canada&Password=a1b2c3d4',
      )
      .error(new ProgressEvent('error'), { status: 0 });

    await expectAsync(promise).toBeRejectedWith(
      jasmine.objectContaining<Partial<LoginError>>({
        code: LoginErrorCode.Network,
      }),
    );
  });

  it('should map server failures to a server error', async () => {
    const promise = service.verifyUserLogin('Canada', 'a1b2c3d4');

    httpMock
      .expectOne(
        'https://localhost:7207/api/auth/VerifyUserLogin?LoginName=Canada&Password=a1b2c3d4',
      )
      .flush('Server error', { status: 500, statusText: 'Server Error' });

    await expectAsync(promise).toBeRejectedWith(
      jasmine.objectContaining<Partial<LoginError>>({
        code: LoginErrorCode.Server,
      }),
    );
  });

  it('should reject when apiUrl is missing', async () => {
    appConfigStub.settings.apiUrl = '';

    await expectAsync(service.verifyUserLogin('Canada', 'a1b2c3d4')).toBeRejectedWith(
      jasmine.objectContaining<Partial<LoginError>>({
        code: LoginErrorCode.Configuration,
      }),
    );

    appConfigStub.settings.apiUrl = 'https://localhost:7207/api';
  });
});

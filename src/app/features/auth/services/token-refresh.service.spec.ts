import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { AppConfigService } from '../../../services/app-config.service';
import { TokenRefreshService } from './token-refresh.service';

describe('TokenRefreshService', () => {
  let service: TokenRefreshService;
  let httpMock: HttpTestingController;

  const appConfigStub = {
    settings: {
      apiUrl: 'https://localhost:7207/api',
      authRefreshPath: 'auth/RefreshToken',
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: AppConfigService, useValue: appConfigStub }],
    });

    service = TestBed.inject(TokenRefreshService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should refresh tokens with POST body', async () => {
    const promise = service.refresh('old-refresh-token');

    const req = httpMock.expectOne('https://localhost:7207/api/auth/RefreshToken');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ token: 'old-refresh-token' });

    req.flush({
      status: '200',
      message: 'Success',
      objresult: {
        token: 'new-access-token',
        refreshToken: 'new-refresh-token',
      },
      qrcodeimg: null,
    });

    await expectAsync(promise).toBeResolvedTo({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });
  });

  it('should reject refresh without access token', async () => {
    const promise = service.refresh('old-refresh-token');

    httpMock
      .expectOne('https://localhost:7207/api/auth/RefreshToken')
      .flush({
        status: '200',
        message: 'Success',
        objresult: {},
        qrcodeimg: null,
      });

    await expectAsync(promise).toBeRejectedWith(
      jasmine.objectContaining<Error>({
        message: 'Unable to refresh session.',
      }),
    );
  });
});

import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { AppConfigService } from '../../../services/app-config.service';
import { StoreService } from './store.service';

describe('StoreService', () => {
  let service: StoreService;
  let httpMock: HttpTestingController;

  const appConfigStub = {
    settings: {
      apiUrl: 'https://localhost:7207/api',
      storesPath: 'stores/FillStore',
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: AppConfigService, useValue: appConfigStub }],
    });

    service = TestBed.inject(StoreService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should load stores from FillStore API array response', async () => {
    const promise = service.fillStores(1, 0);

    const req = httpMock.expectOne(
      'https://localhost:7207/api/stores/FillStore?LoginId=1&StoreId=0',
    );
    expect(req.request.method).toBe('GET');

    req.flush({
      status: '200',
      message: 'Success',
      objresult: [
        { StoreID: 7, StoreName: 'NB2020', IsDefault: true },
        { StoreID: 1, StoreName: 'Naimat Al Basar', IsDefault: false },
        { StoreID: 2, StoreName: 'City vision', IsDefault: false },
      ],
      qrcodeimg: null,
    });

    await expectAsync(promise).toBeResolvedTo([
      { storeId: 7, storeName: 'NB2020', isDefault: true },
      { storeId: 1, storeName: 'Naimat Al Basar', isDefault: false },
      { storeId: 2, storeName: 'City vision', isDefault: false },
    ]);
  });

  it('should support the legacy table response shape', async () => {
    const promise = service.fillStores(1, 0);

    httpMock
      .expectOne(
        'https://localhost:7207/api/stores/FillStore?LoginId=1&StoreId=0',
      )
      .flush({
        status: '200',
        message: 'Success',
        objresult: {
          table: [
            { storeID: 1, storeName: 'Naimat Al Basar' },
            { storeID: 2, storeName: 'City vision' },
          ],
        },
        qrcodeimg: null,
      });

    await expectAsync(promise).toBeResolvedTo([
      { storeId: 1, storeName: 'Naimat Al Basar', isDefault: false },
      { storeId: 2, storeName: 'City vision', isDefault: false },
    ]);
  });
});

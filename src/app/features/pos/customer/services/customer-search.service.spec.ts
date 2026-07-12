import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { AppConfigService } from '../../../../services/app-config.service';
import { CustomerSearchService } from './customer-search.service';

describe('CustomerSearchService', () => {
  let service: CustomerSearchService;
  let httpMock: HttpTestingController;

  const appConfigStub = {
    settings: {
      apiUrl: 'https://demo.api.eyewacloud.com/api',
      customerSearchPath: 'sales/customersearchfilter',
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: AppConfigService, useValue: appConfigStub }],
    });

    service = TestBed.inject(CustomerSearchService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should search customers by query', async () => {
    const promise = service.search('96');

    const req = httpMock.expectOne(
      'https://demo.api.eyewacloud.com/api/sales/customersearchfilter?mobileNumber=96',
    );
    expect(req.request.method).toBe('GET');

    req.flush({
      status: '200',
      message: 'Success',
      objresult: [
        {
          ID: 114055,
          InvoiceNo: 'NAB-24062026-28727',
          CustomerNo: '9666123883',
          chkavail: null,
          CustomerName: 'Ahmed',
        },
      ],
      qrcodeimg: null,
    });

    await expectAsync(promise).toBeResolvedTo([
      jasmine.objectContaining({
        displayName: 'Ahmed',
        phoneMasked: '9666123883',
        invoiceNo: 'NAB-24062026-28727',
        salesId: 114055,
      }),
    ]);
  });

  it('should return empty array for blank query', async () => {
    await expectAsync(service.search('   ')).toBeResolvedTo([]);
  });

  it('should reject queries shorter than minimum length', async () => {
    await expectAsync(service.search('9')).toBeRejectedWith(
      jasmine.objectContaining<Error>({
        message: 'Enter at least 2 characters to search.',
      }),
    );
  });

  it('should map network failures to a friendly error', async () => {
    const promise = service.search('966');

    httpMock
      .expectOne(
        'https://demo.api.eyewacloud.com/api/sales/customersearchfilter?mobileNumber=966',
      )
      .error(new ProgressEvent('error'), { status: 0 });

    await expectAsync(promise).toBeRejectedWith(
      jasmine.objectContaining<Error>({
        message: 'Unable to reach the server. Check your connection and try again.',
      }),
    );
  });
});

import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { AppConfigService } from '../../../../services/app-config.service';
import { CustomerService } from './customer.service';

describe('CustomerService', () => {
  let service: CustomerService;
  let httpMock: HttpTestingController;

  const appConfigStub = {
    settings: {
      apiUrl: 'https://localhost:44314/api',
      insertSalesPath: 'sales/InsertSales',
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: AppConfigService, useValue: appConfigStub }],
    });

    service = TestBed.inject(CustomerService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should post InsertSales payload and map array response', async () => {
    const payload = {
      storeId: '1',
      customerName: 'test',
      customerNo: '8019382407',
      loginId: '1',
      invoiceNo: '',
      invoiceDate: '24-6-2026',
    };

    const promise = service.insertSales(payload);

    const req = httpMock.expectOne('https://localhost:44314/api/sales/InsertSales');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);

    req.flush({
      status: '200',
      message: 'Success',
      objresult: [
        {
          Status: 'Record Inserted Successfully.',
          ID: 114057,
          InvoiceNo: '2020-24062026-34668',
          CustomerNo: '8019382407',
          chkavail: null,
          CustomerName: 'test',
        },
      ],
      qrcodeimg: null,
    });

    await expectAsync(promise).toBeResolvedTo({
      status: 'Record Inserted Successfully.',
      message: 'Success',
      responseStatus: '200',
      id: 114057,
      invoiceNo: '2020-24062026-34668',
      customerNo: '8019382407',
      customerName: 'test',
    });
  });

  it('should support the legacy table response shape', async () => {
    const payload = {
      storeId: '1',
      customerName: 'Ahmed',
      customerNo: '9666123883',
      loginId: '1',
      invoiceNo: '',
      invoiceDate: '22-6-2026',
    };

    const promise = service.insertSales(payload);

    httpMock
      .expectOne('https://localhost:44314/api/sales/InsertSales')
      .flush({
        status: '200',
        message: 'Success',
        objresult: {
          table: [
            {
              status: 'Record Inserted Successfully.',
              id: 114040,
              invoiceNo: 'NAB-22062026-28721',
              customerNo: '9666123883',
              chkavail: null,
            },
          ],
        },
        qrcodeimg: null,
      });

    await expectAsync(promise).toBeResolvedTo({
      status: 'Record Inserted Successfully.',
      message: 'Success',
      responseStatus: '200',
      id: 114040,
      invoiceNo: 'NAB-22062026-28721',
      customerNo: '9666123883',
      customerName: undefined,
    });
  });
});

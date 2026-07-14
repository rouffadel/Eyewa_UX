import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { AppConfigService } from '../../../../services/app-config.service';
import { SalesDetailsService } from './sales-details.service';

describe('SalesDetailsService', () => {
  let service: SalesDetailsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        SalesDetailsService,
        {
          provide: AppConfigService,
          useValue: {
            settings: {
              apiUrl: 'https://demo.api.eyewacloud.com/api',
              getSalesDetailsGridPath: 'sales/GetSalesDetailsGrid',
            },
          },
        },
      ],
    });

    service = TestBed.inject(SalesDetailsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should map array objresult with PascalCase prescription fields', async () => {
    const promise = service.getSalesDetailsGrid(114090);

    const req = httpMock.expectOne(
      'https://demo.api.eyewacloud.com/api/sales/GetSalesDetailsGrid?SalesId=114090',
    );
    expect(req.request.method).toBe('GET');

    req.flush({
      status: '200',
      message: 'Success',
      objresult: [
        {
          SaleID: 114090,
          CustomerName: 'Mounika',
          CustomerNo: '9809878789',
          InvoiceNo: 'NAB-02072026-28745',
          InvoiceDate: '2026-07-02',
          SPH_RightEye: '+15.25',
          CYL_RightEye: '+5.00',
          AXIS_RightEye: '177',
          ADD_RightEye: '3.00',
          SPH_LeftEye: '1',
          CYL_LeftEye: '1',
          AXIS_LeftEye: '1',
          ADD_LeftEye: '1',
          SPH_IPD: null,
          ADD_IPD: null,
        },
      ],
      qrcodeimg: null,
    });

    const result = await promise;
    expect(result.prescription).not.toBeNull();
    expect(result.prescription?.od.sph).toBe('+15.25');
    expect(result.prescription?.od.add).toBe('3.00');
    expect(result.prescription?.os.axis).toBe('1');
    expect(result.prescription?.date).toBe('02-07-2026');
  });

  it('should support legacy table objresult shape', async () => {
    const promise = service.getSalesDetailsGrid(114091);

    httpMock
      .expectOne('https://demo.api.eyewacloud.com/api/sales/GetSalesDetailsGrid?SalesId=114091')
      .flush({
        status: '200',
        message: 'Success',
        objresult: {
          table: [
            {
              saleID: 114091,
              invoiceDate: '2026-07-01',
              spH_RightEye: '-1.50',
              cyL_RightEye: '-0.75',
              axiS_RightEye: '180',
              spH_LeftEye: '-1.25',
              cyL_LeftEye: '-1.00',
              axiS_LeftEye: '175',
            },
          ],
        },
        qrcodeimg: null,
      });

    const result = await promise;
    expect(result.prescription?.od.sph).toBe('-1.50');
  });

  it('should return null prescription when eye values are absent', async () => {
    const promise = service.getSalesDetailsGrid(114092);

    httpMock
      .expectOne('https://demo.api.eyewacloud.com/api/sales/GetSalesDetailsGrid?SalesId=114092')
      .flush({
        status: '200',
        message: 'Success',
        objresult: [
          {
            SaleID: 114092,
            CustomerName: 'Mounika',
            InvoiceDate: '2026-07-02',
            SPH_RightEye: null,
            CYL_RightEye: null,
            AXIS_RightEye: null,
            ADD_RightEye: null,
            SPH_LeftEye: null,
            CYL_LeftEye: null,
            AXIS_LeftEye: null,
            ADD_LeftEye: null,
          },
        ],
        qrcodeimg: null,
      });

    const result = await promise;
    expect(result.prescription).toBeNull();
    expect(result.row).not.toBeNull();
  });

  it('should map table, table1, and table2 from grid response', async () => {
    const promise = service.getSalesDetailsGrid(114122);

    httpMock
      .expectOne('https://demo.api.eyewacloud.com/api/sales/GetSalesDetailsGrid?SalesId=114122')
      .flush({
        status: '200',
        message: 'Success',
        objresult: {
          table: [
            {
              SaleID: 114122,
              CustomerName: 'ishaq shaik',
              CustomerNo: '8886453629',
              GrossTotal: 480,
              Discount: 0,
              NetTotal: 480,
              Balance: 180,
              InvoiceNo: 'NAB-08072026-28763',
              InvoiceDate: '2026-07-08',
              SPH_RightEye: '+15.25',
              CYL_RightEye: '+5.25',
              AXIS_RightEye: '177',
              ADD_RightEye: '3.00',
              SPH_LeftEye: '1',
              CYL_LeftEye: '1',
              AXIS_LeftEye: '1',
              ADD_LeftEye: '1',
              TotalTax: 0,
            },
          ],
          table1: [
            {
              CategoryName: 'Sunglasses - M',
              CategoryID: 6,
              BrandID: 290,
              ProductID: 12,
              SellingPrice: 480,
              ProductValue: 480,
              Quantity: 1,
              SalesDetailsID: 107386,
              ProductName: 'BNS1078',
              BrandName: 'B0NO',
              MaxDiscount: 75,
              Discount: 0,
              Tax: 0,
              TaxPercent: 0,
            },
          ],
          table2: [{ PaidAmount: null }],
          table3: [],
        },
        qrcodeimg: null,
      });

    const result = await promise;

    expect(result.prescription?.od.sph).toBe('+15.25');
    expect(result.lineItems.length).toBe(1);
    expect(result.lineItems[0].productName).toBe('BNS1078');
    expect(result.payment).toEqual({
      grossTotal: 480,
      discount: 0,
      netTotal: 480,
      balance: 180,
      totalTax: 0,
      paidAmount: null,
    });
    expect(result.qrcodeImg).toBeNull();
  });

  it('should map qrcodeimg from grid response', async () => {
    const promise = service.getSalesDetailsGrid(114125);

    httpMock
      .expectOne('https://demo.api.eyewacloud.com/api/sales/GetSalesDetailsGrid?SalesId=114125')
      .flush({
        status: '200',
        message: 'Success',
        objresult: {
          table: [{ SaleID: 114125, NetTotal: 480, Balance: 0, GrossTotal: 480, Discount: 0, TotalTax: 0 }],
          table1: [],
        },
        qrcodeimg: 'data:image/png;base64,abc123',
      });

    const result = await promise;
    expect(result.qrcodeImg).toBe('data:image/png;base64,abc123');
  });
});

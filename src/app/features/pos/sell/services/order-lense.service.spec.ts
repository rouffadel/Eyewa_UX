import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { AppConfigService } from '../../../../services/app-config.service';
import { OrderLenseService } from './order-lense.service';

describe('OrderLenseService', () => {
  let service: OrderLenseService;
  let httpMock: HttpTestingController;

  const appConfigStub = {
    settings: {
      apiUrl: 'https://demo.api.eyewacloud.com/api',
      getOrderLensePath: 'prescriptions/GetOrderLense',
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: AppConfigService, useValue: appConfigStub }],
    });

    service = TestBed.inject(OrderLenseService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should load order lenses from prescriptions GetOrderLense array response', async () => {
    const promise = service.getOrderLense(114122);

    const req = httpMock.expectOne(
      'https://demo.api.eyewacloud.com/api/prescriptions/GetOrderLense?SalesId=114122',
    );
    expect(req.request.method).toBe('GET');

    req.flush({
      status: '200',
      message: 'Success',
      objresult1: [
        {
          OrderLenseID: 65368,
          SalesID: 114122,
          Category: 'CR39',
          Orderlense: 'test',
          Price: 100,
          Quantity: 2,
          Total: 200,
          IsActive: true,
          IsDeleted: false,
          CreatedDate: '2026-07-08T21:44:40.853',
        },
      ],
      objresult2: [{ SPH: '+15.25', CYL: '+5.25', AXIS: '177', AD: '3.00' }],
    });

    await expectAsync(promise).toBeResolvedTo({
      salesId: 114122,
      lenses: [
        jasmine.objectContaining({
          orderLenseId: 65368,
          category: 'CR39',
          orderLense: 'test',
          price: 100,
          quantity: 2,
          total: 200,
        }),
      ],
      od: { sph: '+15.25', cyl: '+5.25', axis: '177', ad: '3.00' },
      os: null,
      additional: null,
    });
  });

  it('should support legacy nested orderLense response shape', async () => {
    const promise = service.getOrderLense(114039);

    httpMock
      .expectOne('https://demo.api.eyewacloud.com/api/prescriptions/GetOrderLense?SalesId=114039')
      .flush({
        status: '200',
        message: 'Success',
        objresult1: {
          orderLense: [
            {
              orderLenseID: 65358,
              salesID: 114039,
              category: 'CR39',
              orderlense: 'gray',
              price: 45,
              quantity: 2,
              total: 90,
              isActive: true,
              isDeleted: false,
              createdDate: '2026-06-16T09:59:50.41',
            },
          ],
        },
        objresult2: {
          table: [{ sph: '-2.75', cyl: '-2.25', axis: '75', ad: '2.00' }],
          table1: [{ sph: '-3.00', cyl: '-1.50', axis: '100', ad: '2.00' }],
          table2: [{ sph: '71', cyl: '', axis: '', ad: '' }],
        },
      });

    await expectAsync(promise).toBeResolvedTo({
      salesId: 114039,
      lenses: [
        jasmine.objectContaining({
          orderLenseId: 65358,
          category: 'CR39',
          orderLense: 'gray',
          total: 90,
        }),
      ],
      od: { sph: '-2.75', cyl: '-2.25', axis: '75', ad: '2.00' },
      os: { sph: '-3.00', cyl: '-1.50', axis: '100', ad: '2.00' },
      additional: { sph: '71', cyl: '', axis: '', ad: '' },
    });
  });

  it('should return empty order when API has no lens rows', async () => {
    const promise = service.getOrderLense(115042);

    httpMock
      .expectOne('https://demo.api.eyewacloud.com/api/prescriptions/GetOrderLense?SalesId=115042')
      .flush({
        status: '200',
        message: 'Success',
        objresult1: [],
        objresult2: [],
      });

    await expectAsync(promise).toBeResolvedTo({
      salesId: 115042,
      lenses: [],
      od: null,
      os: null,
      additional: null,
    });
  });
});

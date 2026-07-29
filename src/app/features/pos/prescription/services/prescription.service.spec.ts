import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { AppConfigService } from '../../../../services/app-config.service';
import { PrescriptionService } from './prescription.service';

describe('PrescriptionService', () => {
  let service: PrescriptionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        PrescriptionService,
        {
          provide: AppConfigService,
          useValue: {
            settings: {
              apiUrl: 'https://localhost:7207/api',
              saveOrderLensePath: 'prescriptions/SaveOrderLense',
            },
          },
        },
      ],
    });

    service = TestBed.inject(PrescriptionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should require salesId before save', async () => {
    await expectAsync(
      service.save({
        customerId: '114039',
        orderLensEnabled: false,
        frames: [],
        lenses: [],
        rightEye: { sph: -1.5, cyl: -0.75, axis: 180, add: 1.25 },
        leftEye: { sph: -1.25, cyl: -1, axis: 175, add: 1.25 },
        pd: 62,
        nearPd: 1.25,
        vd: 12,
        notes: '',
      }),
    ).toBeRejectedWithError('Sales ID is required to save prescription.');
  });

  it('should post SaveOrderLense payload', async () => {
    const promise = service.save({
      customerId: '114039',
      salesId: 117073,
      orderLensEnabled: true,
      frames: [],
      lenses: [
        {
          category: 'CR39',
          orderLens: 'Biua',
          price: 100,
          quantity: 1,
        },
      ],
      rightEye: { sph: 1.25, cyl: 0.75, axis: 4, add: 0.5 },
      leftEye: { sph: 1.25, cyl: 1, axis: 2, add: 0.25 },
      pd: 62,
      nearPd: 60,
      vd: 12,
      notes: 'IPD note',
    });

    const req = httpMock.expectOne(
      'https://localhost:7207/api/prescriptions/SaveOrderLense',
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      OrderLenses: [
        {
          CategoryId: 'CR39',
          Brand: 'Biua',
          Price: '100',
          Quantity: '1',
          Total: 100,
        },
      ],
      PrescriptionDetails: [
        { sph: '+1.25', cyl: '+0.75', axis: '4', add: '0.50' },
        { sph: '+1.25', cyl: '+1.00', axis: '2', add: '0.25' },
      ],
      PrescriptionIpd: {
        sphtext: '1',
        cyltext: '1',
        axistext: '1',
        addtext: '1',
      },
      SalesId: 117073,
    });

    req.flush({
      status: '200',
      message: 'Success',
      objresult: {
        table: [
          {
            status: 'Success',
            id: 117072,
            invoiceNo: '',
            customerNo: '',
            chkavail: null,
          },
        ],
      },
      qrcodeimg: null,
    });

    await expectAsync(promise).toBeResolvedTo(
      jasmine.objectContaining({
        id: '117072',
        salesId: 117073,
        customerId: '114039',
      }),
    );
  });
});

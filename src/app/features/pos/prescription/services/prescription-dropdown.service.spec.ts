import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { AppConfigService } from '../../../../services/app-config.service';
import { PrescriptionDropdownService } from './prescription-dropdown.service';

describe('PrescriptionDropdownService', () => {
  let service: PrescriptionDropdownService;
  let httpMock: HttpTestingController;

  const appConfigStub = {
    settings: {
      apiUrl: 'https://localhost:7207/api',
      getPrescriptionDropDownsPath: 'prescriptions/GetPrescriptionDropDowns',
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: AppConfigService, useValue: appConfigStub }],
    });

    service = TestBed.inject(PrescriptionDropdownService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should load prescription dropdowns from API', async () => {
    const promise = service.getDropdowns();

    const req = httpMock.expectOne(
      'https://localhost:7207/api/prescriptions/GetPrescriptionDropDowns',
    );
    expect(req.request.method).toBe('GET');

    req.flush({
      status: '200',
      message: 'Success',
      objresult: {
        SPH: [{ txt: '+1.25', val: '+1.25' }],
        CYL: [{ txt: '-0.75', val: '-0.75' }],
        AXIS: [{ txt: 180, val: 180 }],
        ADD: [{ txt: '2.50', val: '2.50' }],
      },
      qrcodeimg: null,
    });

    await expectAsync(promise).toBeResolvedTo({
      sph: [{ label: '+1.25', value: 1.25 }],
      cyl: [{ label: '-0.75', value: -0.75 }],
      axis: [{ label: '180', value: 180 }],
      add: [{ label: '2.50', value: 2.5 }],
    });
  });
});

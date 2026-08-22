import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { AppConfigService } from '../../../../services/app-config.service';
import { InsuranceService } from './insurance.service';

describe('InsuranceService', () => {
  let service: InsuranceService;
  let httpMock: HttpTestingController;

  const appConfigStub = {
    settings: {
      apiUrl: 'https://localhost:44314/api',
      getInsuranceBySalesIdPath: 'insurance/GetInsuranceBySalesId',
      getAllInsuranceCompaniesPath: 'insurance/GetAllInsuranceCompanies',
      saveSalesInsurancePath: 'insurance/SaveSalesInsurance',
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: AppConfigService, useValue: appConfigStub }],
    });

    service = TestBed.inject(InsuranceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should load all insurance companies', async () => {
    const promise = service.getAllInsuranceCompanies();

    const req = httpMock.expectOne(
      'https://localhost:44314/api/insurance/GetAllInsuranceCompanies',
    );
    expect(req.request.method).toBe('GET');

    req.flush({
      status: '200',
      message: 'Success',
      objresult: [
        {
          InsuranceCompanyId: 1,
          InsuranceCompanyName: 'Tawuniya',
          TaxRegistrationNumber: '300123456789',
          ContactEmail: 'info@tawuniya.com',
          ContactPhone: '920000000',
          IsActive: true,
        },
        {
          InsuranceCompanyId: 2,
          InsuranceCompanyName: 'Inactive Co',
          IsActive: false,
        },
      ],
      qrcodeimg: null,
    });

    await expectAsync(promise).toBeResolvedTo([{ id: 1, name: 'Tawuniya' }]);
  });

  it('should load insurance by sales id', async () => {
    const promise = service.getInsuranceBySalesId(114135);

    const req = httpMock.expectOne(
      'https://localhost:44314/api/insurance/GetInsuranceBySalesId?salesId=114135',
    );
    expect(req.request.method).toBe('GET');

    req.flush({
      status: '200',
      message: 'Success',
      objresult: [
        {
          SalesInsuranceId: 1,
          SalesId: 114135,
          InsuranceCompanyId: 1,
          InsuranceCompanyName: 'Tawuniya',
          TaxRegistrationNumber: '300123456789',
          PolicyNumber: 'POL-987654321',
          Compensation: 15.5,
          CompensationType: 'percentage',
          ValidityEndDate: '2027-12-31T00:00:00',
          IsActive: true,
        },
      ],
      qrcodeimg: null,
    });

    await expectAsync(promise).toBeResolvedTo({
      salesInsuranceId: 1,
      salesId: 114135,
      insuranceCompanyId: 1,
      insuranceCompanyName: 'Tawuniya',
      taxRegistrationNumber: '300123456789',
      policyNumber: 'POL-987654321',
      compensation: 15.5,
      compensationType: 'percentage',
      validityStartDate: null,
      validityEndDate: '2027-12-31T00:00:00',
      isActive: true,
    });
  });

  it('should return null when no insurance rows exist', async () => {
    const promise = service.getInsuranceBySalesId(114135);

    httpMock
      .expectOne(
        'https://localhost:44314/api/insurance/GetInsuranceBySalesId?salesId=114135',
      )
      .flush({
        status: '200',
        message: 'Success',
        objresult: [],
        qrcodeimg: null,
      });

    await expectAsync(promise).toBeResolvedTo(null);
  });

  it('should post SaveSalesInsurance payload', async () => {
    const promise = service.saveSalesInsurance({
      SalesId: 114130,
      InsuranceCompanyId: 1,
      PolicyNumber: 'POL-987654321',
      Compensation: 15.5,
      CompensationType: 'percentage',
      ValidityStartDate: null,
      ValidityEndDate: '2027-12-31T00:00:00',
    });

    const req = httpMock.expectOne(
      'https://localhost:44314/api/insurance/SaveSalesInsurance',
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      SalesId: 114130,
      InsuranceCompanyId: 1,
      PolicyNumber: 'POL-987654321',
      Compensation: 15.5,
      CompensationType: 'percentage',
      ValidityStartDate: null,
      ValidityEndDate: '2027-12-31T00:00:00',
    });

    req.flush({
      status: '200',
      message: 'Success',
      objresult: null,
      qrcodeimg: null,
    });

    await expectAsync(promise).toBeResolved();
  });

  it('should reject save when API returns non-200 status', async () => {
    const promise = service.saveSalesInsurance({
      SalesId: 114130,
      InsuranceCompanyId: 1,
      PolicyNumber: 'POL-1',
      Compensation: 10,
      CompensationType: 'percentage',
      ValidityStartDate: null,
      ValidityEndDate: '2027-12-31T00:00:00',
    });

    httpMock
      .expectOne('https://localhost:44314/api/insurance/SaveSalesInsurance')
      .flush({
        status: '400',
        message: 'Invalid policy number',
        objresult: null,
        qrcodeimg: null,
      });

    await expectAsync(promise).toBeRejectedWithError('Invalid policy number');
  });
});

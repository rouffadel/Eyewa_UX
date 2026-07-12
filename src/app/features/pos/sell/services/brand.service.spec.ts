import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { AppConfigService } from '../../../../services/app-config.service';
import { BrandService } from './brand.service';

describe('BrandService', () => {
  let service: BrandService;
  let httpMock: HttpTestingController;

  const appConfigStub = {
    settings: {
      apiUrl: 'https://demo.api.eyewacloud.com/api',
      getBrandPath: 'products/GetBrand',
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: AppConfigService, useValue: appConfigStub }],
    });

    service = TestBed.inject(BrandService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should load brands from GetBrand API array response', async () => {
    const promise = service.getBrands('J');

    const req = httpMock.expectOne(
      'https://demo.api.eyewacloud.com/api/products/GetBrand?BrandName=J',
    );
    expect(req.request.method).toBe('GET');

    req.flush({
      status: '200',
      message: 'Success',
      objresult: [
        { BrandID: 27, BrandName: 'Jeans Club' },
        { BrandID: 75, BrandName: 'JORDAN' },
        { BrandID: 106, BrandName: 'JAGUAR' },
      ],
      qrcodeimg: null,
    });

    await expectAsync(promise).toBeResolvedTo([
      { brandId: 27, brandName: 'Jeans Club' },
      { brandId: 75, brandName: 'JORDAN' },
      { brandId: 106, brandName: 'JAGUAR' },
    ]);
  });

  it('should load brands from legacy table response', async () => {
    const promise = service.getBrands('A');

    const req = httpMock.expectOne(
      'https://demo.api.eyewacloud.com/api/products/GetBrand?BrandName=A',
    );
    expect(req.request.method).toBe('GET');

    req.flush({
      status: '200',
      message: 'Success',
      objresult: {
        table: [
          { brandID: 1, brandName: 'Avanti' },
          { brandID: 319, brandName: 'ARMANI' },
        ],
      },
      qrcodeimg: null,
    });

    await expectAsync(promise).toBeResolvedTo([
      { brandId: 1, brandName: 'Avanti' },
      { brandId: 319, brandName: 'ARMANI' },
    ]);
  });

  it('should load brands when objresult is a direct array', async () => {
    const promise = service.getBrands('b');

    const req = httpMock.expectOne(
      'https://demo.api.eyewacloud.com/api/products/GetBrand?BrandName=b',
    );
    req.flush({
      status: '200',
      message: 'Success',
      objresult: [
        { BrandID: 128, BrandName: 'Bella' },
        { BrandID: 278, BrandName: 'BUTTERFLY' },
      ],
    });

    await expectAsync(promise).toBeResolvedTo([
      { brandId: 128, brandName: 'Bella' },
      { brandId: 278, brandName: 'BUTTERFLY' },
    ]);
  });

  it('should trim brand name in query', async () => {
    const promise = service.getBrands('  Ray  ');

    const req = httpMock.expectOne(
      'https://demo.api.eyewacloud.com/api/products/GetBrand?BrandName=Ray',
    );
    req.flush({
      status: '200',
      message: 'Success',
      objresult: { table: [] },
      qrcodeimg: null,
    });

    await expectAsync(promise).toBeResolvedTo([]);
  });
});

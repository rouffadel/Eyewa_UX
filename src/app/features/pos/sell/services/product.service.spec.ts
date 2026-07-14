import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { AppConfigService } from '../../../../services/app-config.service';
import { ProductService } from './product.service';

describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;

  const appConfigStub = {
    settings: {
      apiUrl: 'https://demo.api.eyewacloud.com/api',
      getProductPath: 'products/GetProduct',
      searchProductByKeyPath: 'products/GetProduct',
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: AppConfigService, useValue: appConfigStub }],
    });

    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should load products from GetProduct API', async () => {
    const promise = service.searchProducts({
      categoryId: 6,
      brandId: 8,
      storeId: 2,
      productName: 'b',
    });

    const req = httpMock.expectOne(
      'https://demo.api.eyewacloud.com/api/products/GetProduct?CategoryId=6&BrandId=8&StoreId=2&ProductName=b',
    );
    expect(req.request.method).toBe('GET');

    req.flush({
      status: '200',
      message: 'Success',
      objresult: {
        table: [
          {
            productName: 'BNS1078',
            productValue: 480,
            maxDiscount: 75,
            productID: 12,
            categoryID: 6,
            brandID: 8,
            brandName: 'Bono',
          },
        ],
      },
      qrcodeimg: null,
    });

    await expectAsync(promise).toBeResolvedTo([
      {
        productId: 12,
        productName: 'BNS1078',
        productValue: 480,
        maxDiscount: 75,
        categoryId: 6,
        brandId: 8,
        brandName: 'Bono',
      },
    ]);
  });

  it('should trim product name in query', async () => {
    const promise = service.searchProducts({
      categoryId: 1,
      brandId: 2,
      storeId: 3,
      productName: '  ray  ',
    });

    const req = httpMock.expectOne(
      'https://demo.api.eyewacloud.com/api/products/GetProduct?CategoryId=1&BrandId=2&StoreId=3&ProductName=ray',
    );
    req.flush({
      status: '200',
      message: 'Success',
      objresult: { table: [] },
    });

    await expectAsync(promise).toBeResolvedTo([]);
  });

  it('should parse string productValue for selling price', async () => {
    const promise = service.searchProducts({
      categoryId: 6,
      brandId: 8,
      storeId: 2,
      productName: 'b',
    });

    const req = httpMock.expectOne(
      'https://demo.api.eyewacloud.com/api/products/GetProduct?CategoryId=6&BrandId=8&StoreId=2&ProductName=b',
    );
    req.flush({
      status: '200',
      message: 'Success',
      objresult: {
        table: [
          {
            productName: 'BNS1078',
            productValue: '480.00',
            maxDiscount: '75.00',
            productID: 12,
            categoryID: 6,
            brandID: 8,
            brandName: 'Bono',
          },
        ],
      },
    });

    await expectAsync(promise).toBeResolvedTo([
      jasmine.objectContaining({
        productName: 'BNS1078',
        productValue: 480,
        maxDiscount: 75,
      }),
    ]);
  });

  it('should search products by key via GetProduct with ProductName only', async () => {
    const promise = service.searchProductsByKey('B');

    const req = httpMock.expectOne(
      'https://demo.api.eyewacloud.com/api/products/GetProduct?ProductName=B',
    );
    expect(req.request.method).toBe('GET');

    req.flush({
      status: '200',
      message: 'Success',
      objresult: [
        {
          ProductID: 6782,
          ProductName: '1234B2',
          ProductValue: 370,
          MaxDiscount: 75,
          CategoryID: 1,
          CategoryName: 'Frames - P',
          BrandID: 438,
          BrandName: 'B2',
        },
        {
          ProductID: 2506,
          ProductName: '130B',
          ProductValue: 390,
          MaxDiscount: 75,
          CategoryID: 6,
          CategoryName: 'Sunglasses - M',
          BrandID: 78,
          BrandName: 'CARTIER',
        },
      ],
      qrcodeimg: null,
    });

    await expectAsync(promise).toBeResolvedTo([
      {
        productId: 6782,
        productName: '1234B2',
        productValue: 370,
        maxDiscount: 75,
        categoryId: 1,
        categoryName: 'Frames - P',
        brandId: 438,
        brandName: 'B2',
      },
      {
        productId: 2506,
        productName: '130B',
        productValue: 390,
        maxDiscount: 75,
        categoryId: 6,
        categoryName: 'Sunglasses - M',
        brandId: 78,
        brandName: 'CARTIER',
      },
    ]);
  });

  it('should trim product name for key search', async () => {
    const promise = service.searchProductsByKey('  B  ');

    const req = httpMock.expectOne(
      'https://demo.api.eyewacloud.com/api/products/GetProduct?ProductName=B',
    );
    req.flush({
      status: '200',
      message: 'Success',
      objresult: [],
      qrcodeimg: null,
    });

    await expectAsync(promise).toBeResolvedTo([]);
  });
});

import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { AppConfigService } from '../../../../services/app-config.service';
import { CategoryService } from './category.service';

describe('CategoryService', () => {
  let service: CategoryService;
  let httpMock: HttpTestingController;

  const appConfigStub = {
    settings: {
      apiUrl: 'https://localhost:44314/api',
      fillCategoryPath: 'products/FillCategory',
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: AppConfigService, useValue: appConfigStub }],
    });

    service = TestBed.inject(CategoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should load categories from FillCategory API', async () => {
    const promise = service.getCategories();

    const req = httpMock.expectOne('https://localhost:44314/api/products/FillCategory');
    expect(req.request.method).toBe('GET');

    req.flush({
      status: '200',
      message: 'Success',
      objresult: [
        { CategoryID: 1, CategoryName: 'Frames - P' },
        { CategoryID: 2, CategoryName: 'Frames - M' },
      ],
    });

    await expectAsync(promise).toBeResolvedTo([
      { categoryId: 1, categoryName: 'Frames - P' },
      { categoryId: 2, categoryName: 'Frames - M' },
    ]);
  });

  it('should support objresult.table shape', async () => {
    const promise = service.getCategories();

    const req = httpMock.expectOne('https://localhost:44314/api/products/FillCategory');
    req.flush({
      status: '200',
      message: 'Success',
      objresult: {
        table: [{ categoryID: 6, categoryName: 'Frames - S' }],
      },
    });

    await expectAsync(promise).toBeResolvedTo([
      { categoryId: 6, categoryName: 'Frames - S' },
    ]);
  });
});

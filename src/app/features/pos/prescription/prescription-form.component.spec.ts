import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { PrescriptionFormComponent } from './prescription-form.component';
import { PrescriptionService } from './services/prescription.service';
import { PrescriptionLocalStorageService } from './services/prescription-local-storage.service';
import { PrescriptionDropdownService } from './services/prescription-dropdown.service';
import { CategoryService } from '../sell/services/category.service';
import { BrandService } from '../sell/services/brand.service';
import { ProductService } from '../sell/services/product.service';
import { SellSessionStore } from '../sell/services/sell-session.store';
import { AuthService } from '../../auth/services/auth.service';
import { AppConfigService } from '../../../services/app-config.service';
import { Router } from '@angular/router';
import { TEST_CUSTOMER } from '../sell/services/sell.test-fixtures';
import { Customer } from '../sell/models/customer.models';

describe('PrescriptionFormComponent', () => {
  let component: PrescriptionFormComponent;
  let fixture: ComponentFixture<PrescriptionFormComponent>;
  let prescriptionService: jasmine.SpyObj<PrescriptionService>;
  let prescriptionStorage: jasmine.SpyObj<PrescriptionLocalStorageService>;
  let prescriptionDropdownService: jasmine.SpyObj<PrescriptionDropdownService>;
  let categoryService: jasmine.SpyObj<CategoryService>;
  let brandService: jasmine.SpyObj<BrandService>;
  let productService: jasmine.SpyObj<ProductService>;
  let sellStore: {
    selectedCustomer: WritableSignal<Customer | null>;
    selectedPrescriptionId: WritableSignal<string | null>;
    applySavedPrescription: jasmine.Spy;
    applyFramesOnlyToCart: jasmine.Spy;
  };
  let authService: { selectedStore: () => { storeId: number; storeName: string }; user: () => null };
  let router: jasmine.SpyObj<Router>;

  const mockSaveRecord = {
    id: 'rx-1',
    customerId: TEST_CUSTOMER.id,
    orderLensEnabled: true,
    frames: [],
    lenses: [
      {
        category: 'CR39',
        orderLens: 'Blue Cut',
        price: 100,
        quantity: 1,
      },
    ],
    rightEye: { sph: 1.25, cyl: -0.75, axis: 180, add: 2.5 },
    leftEye: { sph: 1.25, cyl: -1, axis: 175, add: 2.5 },
    pd: 62,
    nearPd: 60,
    vd: 12,
    notes: '',
    createdAt: '2024-05-21T10:00:00Z',
    updatedAt: '2024-05-21T10:00:00Z',
  };

  beforeEach(async () => {
    prescriptionService = jasmine.createSpyObj('PrescriptionService', ['print', 'getLastSaved']);
    prescriptionStorage = jasmine.createSpyObj('PrescriptionLocalStorageService', [
      'save',
      'getLastSaved',
      'getLatest',
      'getById',
    ]);
    prescriptionStorage.save.and.returnValue(mockSaveRecord);
    prescriptionStorage.getLastSaved.and.returnValue(null);
    prescriptionStorage.getLatest.and.returnValue(null);
    prescriptionStorage.getById.and.returnValue(null);
    prescriptionDropdownService = jasmine.createSpyObj('PrescriptionDropdownService', ['getDropdowns']);
    prescriptionDropdownService.getDropdowns.and.returnValue(
      Promise.resolve({
        sph: [{ label: '+1.25', value: 1.25 }],
        cyl: [{ label: '-0.75', value: -0.75 }],
        axis: [{ label: '180', value: 180 }],
        add: [{ label: '2.50', value: 2.5 }],
      }),
    );
    categoryService = jasmine.createSpyObj('CategoryService', ['getCategories']);
    categoryService.getCategories.and.returnValue(
      Promise.resolve([
        { categoryId: 1, categoryName: 'Frames - P' },
        { categoryId: 2, categoryName: 'Frames - M' },
      ]),
    );
    brandService = jasmine.createSpyObj('BrandService', ['getBrands']);
    brandService.getBrands.and.returnValue(Promise.resolve([]));
    productService = jasmine.createSpyObj('ProductService', ['searchProducts', 'searchProductsByKey']);
    productService.searchProducts.and.returnValue(Promise.resolve([]));
    productService.searchProductsByKey.and.returnValue(Promise.resolve([]));
    authService = {
      selectedStore: () => ({ storeId: 2, storeName: 'City vision' }),
      user: () => null,
    };
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    router.navigate.and.resolveTo(true);
    sellStore = {
      selectedCustomer: signal(TEST_CUSTOMER),
      selectedPrescriptionId: signal<string | null>(null),
      applySavedPrescription: jasmine.createSpy('applySavedPrescription'),
      applyFramesOnlyToCart: jasmine.createSpy('applyFramesOnlyToCart'),
    };

    await TestBed.configureTestingModule({
      imports: [PrescriptionFormComponent],
      providers: [
        { provide: PrescriptionService, useValue: prescriptionService },
        { provide: PrescriptionLocalStorageService, useValue: prescriptionStorage },
        { provide: PrescriptionDropdownService, useValue: prescriptionDropdownService },
        { provide: CategoryService, useValue: categoryService },
        { provide: BrandService, useValue: brandService },
        { provide: ProductService, useValue: productService },
        { provide: AuthService, useValue: authService },
        { provide: SellSessionStore, useValue: sellStore },
        {
          provide: AppConfigService,
          useValue: { settings: { prescriptionFramesTemplate: 'guided' } },
        },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PrescriptionFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render prescription headings and action buttons', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('PRESCRIPTION');
    expect(compiled.textContent).toContain('RIGHT EYE (OD)');
    expect(compiled.textContent).toContain('LEFT EYE (OS)');
    expect(compiled.textContent).toContain('Save Prescription');
    expect(compiled.textContent).toContain('Print');
    expect(compiled.textContent).toContain('Cancel');
  });

  it('should not render date or doctor fields', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain('Doctor');
    expect(compiled.querySelector('input[type="date"]')).toBeNull();
  });

  it('should show when the prescription was saved', async () => {
    prescriptionStorage.getLatest.and.returnValue(mockSaveRecord);

    fixture = TestBed.createComponent(PrescriptionFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Saved on');
  });

  it('should render frames and lens sections', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('FRAMES');
    expect(compiled.textContent).toContain('+ Add Frame');
    expect(compiled.textContent).toContain('LENSES');
    expect(compiled.textContent).toContain('+ Add Lens Line');
  });

  it('should block save when a started lens line is incomplete', () => {
    prepareValidRx();
    component['frameLines'].at(0)?.patchValue({
      brandName: '',
      modelNo: '',
      sellingPrice: null,
      discountPercent: null,
    });
    component['lensLines'].at(0)?.patchValue({
      category: 'CR39',
      orderLens: 'Blue Cut',
      price: null,
    });
    component['onSave']();

    expect(prescriptionStorage.save).not.toHaveBeenCalled();
    expect(component['errorMessage']()).toContain('Enter price for lens line');
  });

  it('should block save when frame line has model but no brand', () => {
    prepareValidForm();
    component['frameLines'].at(0)?.patchValue({
      brandName: '',
      modelNo: 'RTA5008',
      sellingPrice: 390,
    });
    component['onSave']();

    expect(prescriptionStorage.save).not.toHaveBeenCalled();
    expect(component['errorMessage']()).toContain('Enter a brand');
  });

  it('should save locally on valid submit', () => {
    prepareValidForm();
    component['onSave']();

    expect(prescriptionStorage.save).toHaveBeenCalledWith(
      jasmine.objectContaining({
        customerId: TEST_CUSTOMER.id,
        salesId: TEST_CUSTOMER.salesId,
      }),
    );
    expect(sellStore.applySavedPrescription).toHaveBeenCalledWith(mockSaveRecord);
    expect(component['successMessage']()).toBe('Prescription saved');
    expect(router.navigate).toHaveBeenCalledWith(['/home/sell']);
  });

  it('should require prescription eye values when saving lenses without frames', () => {
    prepareValidRx();
    component['rightEyeGroup'].patchValue({ sph: null });
    component['frameLines'].at(0)?.patchValue({
      brandName: '',
      modelNo: '',
      sellingPrice: null,
      discountPercent: null,
    });
    component['lensLines'].at(0)?.patchValue({
      category: 'CR39',
      orderLens: 'Blue Cut',
      price: 100,
      quantity: 1,
    });
    component['onSave']();

    expect(prescriptionStorage.save).not.toHaveBeenCalled();
    expect(component['errorMessage']()).toContain('Select SPH for right eye');
  });

  it('should allow frames-only save without lenses or prescription', () => {
    component['rightEyeGroup'].reset();
    component['leftEyeGroup'].reset();
    component['form'].controls.pd.setValue(null);
    component['form'].controls.nearPd.setValue(null);
    component['lensLines'].at(0)?.patchValue({
      category: 'CR39',
      orderLens: '',
      price: null,
    });
    component['frameLines'].at(0)?.patchValue({
      brandId: 1,
      brandName: 'SQEYEWEAR',
      productId: 12,
      modelNo: 'RTA5008',
      sellingPrice: 390,
      quantity: 1,
      discountPercent: null,
    });
    component['onSave']();

    expect(prescriptionStorage.save).toHaveBeenCalled();
    expect(sellStore.applyFramesOnlyToCart).toHaveBeenCalled();
    expect(sellStore.applySavedPrescription).not.toHaveBeenCalled();
    expect(component['successMessage']()).toBe('Frames added to cart');
    expect(router.navigate).toHaveBeenCalledWith(['/home/sell']);
  });

  it('should allow save with empty frames', () => {
    prepareValidForm();
    component['frameLines'].at(0)?.patchValue({
      brandName: '',
      modelNo: '',
      sellingPrice: null,
      discountPercent: null,
    });
    component['onSave']();

    expect(prescriptionStorage.save).toHaveBeenCalled();
  });

  it('should block save when discount exceeds product maxDiscount', () => {
    prepareValidForm();
    component['frameLines'].at(0)?.patchValue({
      maxDiscount: 75,
      discountPercent: 80,
      brandName: 'SQEYEWEAR',
      modelNo: 'RTA5008',
    });
    component['onSave']();

    expect(prescriptionStorage.save).not.toHaveBeenCalled();
    expect(component['errorMessage']()).toContain('Discount cannot exceed 75%');
  });

  it('should reset form on cancel when not dirty', () => {
    component['form'].controls.notes.setValue('Test note');
    component['form'].markAsPristine();

    component['onCancel']();

    expect(component['form'].controls.notes.value).toBe('');
  });

  function prepareValidRx(): void {
    component['rightEyeGroup'].patchValue({
      sph: 1.25,
      cyl: -0.75,
      axis: 180,
      add: 2.5,
    });
    component['leftEyeGroup'].patchValue({
      sph: 1.25,
      cyl: -1,
      axis: 175,
      add: 2.5,
    });
    component['form'].controls.pd.setValue(62);
    component['form'].controls.nearPd.setValue(60);
  }

  function prepareValidForm(): void {
    prepareValidRx();
    component['lensLines'].at(0)?.patchValue({
      category: 'CR39',
      orderLens: 'Blue Cut',
      price: 100,
      quantity: 1,
    });
    component['frameLines'].at(0)?.patchValue({
      brandId: 1,
      brandName: 'SQEYEWEAR',
      productId: 12,
      modelNo: 'RTA5008',
      sellingPrice: 390,
      quantity: 1,
    });
    component['form'].updateValueAndValidity();
  }
});

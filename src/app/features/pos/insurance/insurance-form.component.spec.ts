import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { InsuranceFormComponent } from './insurance-form.component';
import { InsuranceService } from './services/insurance.service';
import { SellSessionStore } from '../sell/services/sell-session.store';
import { TEST_CUSTOMER } from '../sell/services/sell.test-fixtures';
import { Customer } from '../sell/models/customer.models';
import { SalesInsuranceRecord } from './models/insurance.models';

describe('InsuranceFormComponent', () => {
  let fixture: ComponentFixture<InsuranceFormComponent>;
  let component: InsuranceFormComponent;
  let sellStore: {
    selectedCustomer: WritableSignal<Customer | null>;
  };
  let insuranceService: jasmine.SpyObj<InsuranceService>;

  const mockRecord: SalesInsuranceRecord = {
    salesInsuranceId: 1,
    salesId: TEST_CUSTOMER.salesId!,
    insuranceCompanyId: 1,
    insuranceCompanyName: 'Tawuniya',
    taxRegistrationNumber: '300123456789',
    policyNumber: 'POL-987654321',
    compensation: 15.5,
    compensationType: 'percentage',
    validityStartDate: null,
    validityEndDate: '2027-12-31T00:00:00',
    isActive: true,
  };

  const mockCompanies = [
    { id: 1, name: 'Tawuniya' },
    { id: 2, name: 'Bupa' },
  ];

  beforeEach(async () => {
    sellStore = {
      selectedCustomer: signal<Customer | null>(TEST_CUSTOMER),
    };
    insuranceService = jasmine.createSpyObj('InsuranceService', [
      'getAllInsuranceCompanies',
      'getInsuranceBySalesId',
      'saveSalesInsurance',
    ]);
    insuranceService.getAllInsuranceCompanies.and.returnValue(Promise.resolve(mockCompanies));
    insuranceService.getInsuranceBySalesId.and.returnValue(Promise.resolve(null));
    insuranceService.saveSalesInsurance.and.returnValue(Promise.resolve());

    await TestBed.configureTestingModule({
      imports: [InsuranceFormComponent],
      providers: [
        { provide: SellSessionStore, useValue: sellStore },
        { provide: InsuranceService, useValue: insuranceService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InsuranceFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render insurance heading and fields', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('INSURANCE');
    expect(compiled.textContent).toContain('Insurance Company');
    expect(compiled.textContent).toContain('Policy Number');
    expect(compiled.textContent).toContain('Discount');
    expect(compiled.textContent).toContain('Validity End Date');
    expect(compiled.textContent).toContain('Save Insurance');
  });

  it('should load insurance companies into the dropdown', () => {
    expect(insuranceService.getAllInsuranceCompanies).toHaveBeenCalled();
    expect(component['insuranceCompanies']()).toEqual(mockCompanies);
  });

  it('should show customer when selected', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain(TEST_CUSTOMER.displayName);
  });

  it('should load and prefill insurance for selected sale', fakeAsync(() => {
    insuranceService.getInsuranceBySalesId.and.returnValue(Promise.resolve(mockRecord));

    fixture = TestBed.createComponent(InsuranceFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(insuranceService.getInsuranceBySalesId).toHaveBeenCalledWith(TEST_CUSTOMER.salesId!);
    expect(component['form'].value).toEqual({
      insuranceCompanyId: 1,
      policyNumber: 'POL-987654321',
      compensation: 15.5,
      compensationType: 'percentage',
      validityStartDate: null,
      validityEndDate: '2027-12-31',
    });
    expect(component['insuranceCompanies']()).toEqual(mockCompanies);
  }));

  it('should require a customer before save', async () => {
    sellStore.selectedCustomer.set(null);
    fixture.detectChanges();

    await component['onSave']();

    expect(component['errorMessage']()).toContain('Select a customer');
    expect(insuranceService.saveSalesInsurance).not.toHaveBeenCalled();
  });

  it('should validate required fields', async () => {
    await component['onSave']();

    expect(component['errorMessage']()).toContain('Fill in all insurance fields');
    expect(insuranceService.saveSalesInsurance).not.toHaveBeenCalled();
  });

  it('should save insurance and show success', fakeAsync(() => {
    insuranceService.getInsuranceBySalesId.and.returnValue(Promise.resolve(mockRecord));

    component['form'].setValue({
      insuranceCompanyId: 1,
      policyNumber: 'POL-987654321',
      compensation: 15.5,
      compensationType: 'percentage',
      validityStartDate: null,
      validityEndDate: '2027-12-31',
    });

    void component['onSave']();
    tick();
    fixture.detectChanges();

    expect(insuranceService.saveSalesInsurance).toHaveBeenCalledWith({
      SalesId: TEST_CUSTOMER.salesId!,
      InsuranceCompanyId: 1,
      PolicyNumber: 'POL-987654321',
      Compensation: 15.5,
      CompensationType: 'percentage',
      ValidityStartDate: null,
      ValidityEndDate: '2027-12-31T00:00:00',
    });
    expect(component['successMessage']()).toBe('Insurance saved');
    expect(component['form'].value.policyNumber).toBe('POL-987654321');
  }));
});

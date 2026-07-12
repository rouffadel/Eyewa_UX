import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { AuthService } from '../../auth/services/auth.service';
import { StoreService } from '../../auth/services/store.service';
import { CustomerService } from './services/customer.service';
import { CustomerSessionService } from './services/customer-session.service';
import { SellSessionStore } from '../sell/services/sell-session.store';
import { CreateCustomerFormComponent } from './create-customer-form.component';

describe('CreateCustomerFormComponent', () => {
  let fixture: ComponentFixture<CreateCustomerFormComponent>;
  let customerService: jasmine.SpyObj<CustomerService>;
  let customerSession: CustomerSessionService;
  let sellStore: jasmine.SpyObj<SellSessionStore>;
  let router: { navigate: jasmine.Spy };

  beforeEach(async () => {
    customerService = jasmine.createSpyObj<CustomerService>('CustomerService', ['insertSales']);
    customerService.insertSales.and.resolveTo({
      status: 'Record Inserted Successfully.',
      message: 'Success',
      responseStatus: '200',
      id: 114045,
      invoiceNo: '2020-23062026-34663',
      customerNo: '8019382407',
    });

    sellStore = jasmine.createSpyObj<SellSessionStore>('SellSessionStore', ['selectCreatedCustomer']);
    sessionStorage.clear();
    customerSession = new CustomerSessionService();

    await TestBed.configureTestingModule({
      imports: [CreateCustomerFormComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            user: signal({
              loginId: 1,
              loginName: 'CANADA',
              roleId: 1,
              storeId: 1,
              permissions: { view: true, add: true, edit: true, delete: true },
              status: '200',
              message: 'Success',
              qrcodeImg: null,
            }).asReadonly(),
            selectedStore: signal({ storeId: 1, storeName: 'Naimat Al Basar' }).asReadonly(),
          },
        },
        {
          provide: StoreService,
          useValue: {
            fillStores: jasmine
              .createSpy('fillStores')
              .and.resolveTo([{ storeId: 1, storeName: 'Naimat Al Basar' }]),
          },
        },
        { provide: CustomerService, useValue: customerService },
        { provide: CustomerSessionService, useValue: customerSession },
        { provide: SellSessionStore, useValue: sellStore },
      ],
    }).compileComponents();

    router = TestBed.inject(Router) as unknown as { navigate: jasmine.Spy };
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    fixture = TestBed.createComponent(CreateCustomerFormComponent);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render customer name and mobile fields only', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Create Customer');
    expect(compiled.textContent).toContain('Customer Name');
    expect(compiled.textContent).toContain('Mobile No');
    expect(compiled.textContent).not.toContain('Invoice No');
    expect(compiled.textContent).not.toContain('Store');
    expect(compiled.textContent).toContain('Save');
    expect(compiled.textContent).toContain('Cancel');
  });

  it('should keep save disabled until name and mobile are valid', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const saveButton = compiled.querySelector<HTMLButtonElement>('.create-customer-actions__save');

    expect(saveButton?.disabled).toBeTrue();

    fixture.componentInstance['form'].patchValue({
      customerName: 'Ahmed',
      customerNo: '8019382407',
    });
    fixture.detectChanges();

    expect(saveButton?.disabled).toBeFalse();
  });

  it('should call insertSales on save', async () => {
    const compiled = fixture.nativeElement as HTMLElement;

    fixture.componentInstance['form'].patchValue({
      customerName: 'Ahmed',
      customerNo: '8019382407',
    });
    fixture.detectChanges();

    compiled.querySelector<HTMLButtonElement>('.create-customer-actions__save')?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(customerService.insertSales).toHaveBeenCalled();
    expect(customerSession.currentCustomer()?.invoiceNo).toBe('2020-23062026-34663');
    expect(sellStore.selectCreatedCustomer).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/home', 'sell']);

    const payload = customerService.insertSales.calls.mostRecent().args[0];
    expect(payload.customerName).toBe('Ahmed');
    expect(payload.customerNo).toBe('8019382407');
    expect(payload.storeId).toBe('1');
    expect(payload.loginId).toBe('1');
    expect(payload.invoiceNo).toBe('');
  });
});

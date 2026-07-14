import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { AuthService } from '../../../features/auth/services/auth.service';
import { StoreService } from '../../../features/auth/services/store.service';
import { CustomerSearchService } from '../../../features/pos/customer/services/customer-search.service';
import { Customer } from '../../../features/pos/sell/models/customer.models';
import { AppHeaderComponent } from './app-header.component';

describe('AppHeaderComponent', () => {
  let fixture: ComponentFixture<AppHeaderComponent>;
  let storeService: jasmine.SpyObj<StoreService>;
  let customerSearchService: jasmine.SpyObj<CustomerSearchService>;
  let selectStoreSpy: jasmine.Spy;

  beforeEach(async () => {
    storeService = jasmine.createSpyObj<StoreService>('StoreService', ['fillStores']);
    storeService.fillStores.and.resolveTo([
      { storeId: 1, storeName: 'Naimat Al Basar', isDefault: false },
      { storeId: 7, storeName: 'NB2020', isDefault: true },
    ]);

    customerSearchService = jasmine.createSpyObj<CustomerSearchService>('CustomerSearchService', [
      'search',
    ]);
    customerSearchService.search.and.resolveTo([]);

    selectStoreSpy = jasmine.createSpy('selectStore');

    await TestBed.configureTestingModule({
      imports: [AppHeaderComponent],
      providers: [
        {
          provide: AuthService,
          useValue: {
            currentSession: signal({
              displayName: 'Ameer',
              accessToken: 'mock-token',
              user: {
                loginId: 1,
                loginName: 'AMEER',
                roleId: 1,
                storeId: 0,
                permissions: { view: true, add: true, edit: true, delete: true },
                status: '200',
                message: 'Success',
                qrcodeImg: null,
              },
              branchName: 'Main Branch',
              loyaltyPoints: 250,
            }).asReadonly(),
            user: signal({
              loginId: 1,
              loginName: 'AMEER',
              roleId: 1,
              storeId: 0,
              permissions: { view: true, add: true, edit: true, delete: true },
              status: '200',
              message: 'Success',
              qrcodeImg: null,
            }).asReadonly(),
            selectedStore: signal(null).asReadonly(),
            selectStore: selectStoreSpy,
          },
        },
        { provide: StoreService, useValue: storeService },
        { provide: CustomerSearchService, useValue: customerSearchService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppHeaderComponent);
    fixture.componentRef.setInput('notificationCount', 2);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render tablet ERP header per reference', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Eyewa');
    expect(compiled.textContent).toContain('ERP');
    expect(compiled.textContent).toContain('POS');
    expect(compiled.textContent).toContain('Ameer');
    expect(compiled.textContent).toContain('Main Branch');
    expect(compiled.textContent).toContain('250 PTS');
    expect(compiled.textContent).toContain('+ New Customer');
    expect(compiled.querySelector('input[type="search"]')).toBeTruthy();
  });

  it('should not render hamburger menu', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[aria-label="Open menu"]')).toBeNull();
  });

  it('should emit profileClick when left avatar is clicked', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    let emitted = false;

    fixture.componentInstance.profileClick.subscribe(() => {
      emitted = true;
    });

    compiled.querySelector<HTMLButtonElement>('.app-header__avatar')?.click();
    expect(emitted).toBeTrue();
  });

  it('should open store dropdown when profile button is clicked', async () => {
    const compiled = fixture.nativeElement as HTMLElement;
    let profileEmitted = false;

    fixture.componentInstance.profileClick.subscribe(() => {
      profileEmitted = true;
    });

    compiled.querySelector<HTMLButtonElement>('.app-header__profile')?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(profileEmitted).toBeFalse();
    expect(compiled.querySelector('.app-header__store-panel')).toBeTruthy();
    expect(storeService.fillStores).toHaveBeenCalledWith(1, 0);
    expect(selectStoreSpy).toHaveBeenCalledWith({
      storeId: 7,
      storeName: 'NB2020',
      isDefault: true,
    });
  });

  it('should emit newCustomer when button is clicked', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    let emitted = false;

    fixture.componentInstance.newCustomer.subscribe(() => {
      emitted = true;
    });

    compiled.querySelector<HTMLButtonElement>('.app-header__new-customer')?.click();
    expect(emitted).toBeTrue();
  });

  it('should debounce customer search and show dropdown results', fakeAsync(() => {
    customerSearchService.search.and.resolveTo([
      {
        id: '114055',
        displayName: 'Ahmed',
        initials: 'AH',
        phoneMasked: '9666123883',
        loyaltyPoints: 0,
        lastVisit: '—',
        invoiceNo: 'NAB-24062026-28727',
        salesId: 114055,
      },
    ]);

    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      '.app-header__search-input',
    );
    input!.dispatchEvent(new Event('input'));
    fixture.componentInstance['onSearchInput']('96');
    fixture.detectChanges();

    tick(299);
    expect(customerSearchService.search).not.toHaveBeenCalled();

    tick(1);
    tick(0);
    fixture.detectChanges();

    expect(customerSearchService.search).toHaveBeenCalledWith('96');
    expect((fixture.nativeElement as HTMLElement).querySelector('.app-header__search-panel')).toBeTruthy();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Ahmed');
  }));

  it('should emit customerSelected when a search result is clicked', fakeAsync(() => {
    const customer: Customer = {
      id: '114055',
      displayName: 'Ahmed',
      initials: 'AH',
      phoneMasked: '9666123883',
      loyaltyPoints: 0,
      lastVisit: '—',
      invoiceNo: 'NAB-24062026-28727',
      salesId: 114055,
    };
    customerSearchService.search.and.resolveTo([customer]);

    let selected: Customer | undefined;
    fixture.componentInstance.customerSelected.subscribe((value) => {
      selected = value;
    });

    fixture.componentInstance['onSearchInput']('96');
    tick(300);
    tick(0);
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('.app-header__search-option')
      ?.click();

    expect(selected).toEqual(customer);
  }));
});

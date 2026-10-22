import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CustomerOrderHistoryModalComponent } from './customer-order-history-modal.component';
import { AppConfigService } from '../../../../services/app-config.service';
import { TranslationService } from '../../../../services/translation.service';
import { CustomerService } from '../services/customer.service';
import { Customer } from '../../sell/models/customer.models';

describe('CustomerOrderHistoryModalComponent', () => {
  let component: CustomerOrderHistoryModalComponent;
  let fixture: ComponentFixture<CustomerOrderHistoryModalComponent>;
  let httpMock: HttpTestingController;

  const mockCustomer: Customer = {
    id: '8978674245',
    displayName: 'TestSq',
    initials: 'TS',
    phoneMasked: '8978674245',
    loyaltyPoints: 12130,
    lastVisit: '08-10-2026',
    salesId: 115230,
    invoiceNo: 'NAB-08102026-28800'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerOrderHistoryModalComponent, HttpClientTestingModule],
      providers: [
        {
          provide: AppConfigService,
          useValue: {
            settings: { apiUrl: 'https://localhost:7207/api' }
          }
        },
        {
          provide: TranslationService,
          useValue: {
            translate: (key: string) => key,
            currentLang: () => 'en'
          }
        },
        {
          provide: CustomerService,
          useValue: {
            getCustomerLoyaltyPoints: () => Promise.resolve(12130)
          }
        }
      ]
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CustomerOrderHistoryModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('customer', mockCustomer);
    fixture.detectChanges();

    // Respond to statuses request
    const statusReq = httpMock.expectOne('https://localhost:7207/api/sales/statuses');
    statusReq.flush([{ id: 1, statusName: 'Ready', isActive: true }]);

    // Respond to orders request
    const ordersReq = httpMock.expectOne(
      'https://localhost:7207/api/sales/order-status-list?search=8978674245'
    );
    ordersReq.flush([
      {
        salesId: 115230,
        invoiceNo: 'NAB-08102026-28800',
        customerName: 'TestSq',
        productName: 'Multiple Items',
        paidAmount: 250,
        balance: 100.6,
        statusName: 'Ready'
      }
    ]);

    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create and render customer name and initials', () => {
    expect(component).toBeTruthy();
    const nameEl = fixture.nativeElement.querySelector('.customer-name');
    expect(nameEl.textContent).toContain('TestSq');
  });

  it('should render customer orders in the table', () => {
    const rows = fixture.nativeElement.querySelectorAll('.order-row');
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('NAB-08102026-28800');
    expect(rows[0].textContent).toContain('250.00');
  });

  it('should emit close on close button click', () => {
    let closed = false;
    component.close.subscribe(() => (closed = true));
    const closeBtn = fixture.nativeElement.querySelector('.btn-close');
    closeBtn.click();
    expect(closed).toBeTrue();
  });

  it('should emit startSale on start sale button click', () => {
    let selected: Customer | null = null;
    component.startSale.subscribe((c) => (selected = c));
    const startSaleBtn = fixture.nativeElement.querySelector('.btn-start-sale');
    startSaleBtn.click();
    expect(selected as Customer | null).toEqual(mockCustomer);
  });
});

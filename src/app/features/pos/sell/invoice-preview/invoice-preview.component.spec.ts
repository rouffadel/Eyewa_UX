import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { AppConfigService } from '../../../../services/app-config.service';
import { InvoiceViewModel } from '../models/invoice.models';
import { SellSessionStore } from '../services/sell-session.store';
import { InvoicePreviewComponent } from './invoice-preview.component';

describe('InvoicePreviewComponent', () => {
  let fixture: ComponentFixture<InvoicePreviewComponent>;
  let router: Router;
  let store: SellSessionStore;

  const mockInvoice: InvoiceViewModel = {
    invoiceNo: 'INV-001',
    invoiceDate: '23-06-2026 00:00:00',
    customerName: 'Saud Ahmed',
    contactNo: '0505937411',
    productLines: [
      {
        category: 'Frames',
        brand: 'SQEYEWEAR',
        modelNo: 'RTA5008',
        sellingPrice: '390.00',
        quantity: '1',
        total: '250.00',
      },
    ],
    rxRows: [
      { label: 'Right Eye', sph: '-2.75', cyl: '0.00', axis: '0', add: '2.50' },
      { label: 'Left Eye', sph: '+1.25', cyl: '-2.00', axis: '90', add: '2.50' },
      { label: 'IPD', sph: '62.0 mc', cyl: '—', axis: '—', add: '—' },
    ],
    details: 'Test note',
    totalAmount: '250.00',
    amountPaid: '250.00',
    balance: '0.00',
    user: 'Ameer',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoicePreviewComponent, HttpClientTestingModule],
      providers: [
        provideRouter([]),
        SellSessionStore,
        {
          provide: AppConfigService,
          useValue: { settings: { vatRate: 0.15 } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InvoicePreviewComponent);
    router = TestBed.inject(Router);
    store = TestBed.inject(SellSessionStore);
    store.lastInvoice.set(mockInvoice);
    spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  it('should render invoice fields', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('INVOICE');
    expect(compiled.textContent).toContain('INV-001');
    expect(compiled.textContent).toContain('Saud Ahmed');
    expect(compiled.textContent).toContain('SQEYEWEAR');
    expect(compiled.textContent).toContain('Total Amount');
    expect(compiled.textContent).toContain('Print');
    expect(compiled.textContent).toContain('Cancel');
  });

  it('should navigate back to sell on cancel', () => {
    fixture.componentInstance['onCancel']();
    expect(router.navigate).toHaveBeenCalledWith(['/home/sell']);
  });
});

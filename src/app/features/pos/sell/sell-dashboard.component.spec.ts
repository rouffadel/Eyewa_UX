import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { AppConfigService } from '../../../services/app-config.service';
import { AuthService } from '../../auth/services/auth.service';
import { CustomerSessionService } from '../customer/services/customer-session.service';
import { SellDashboardComponent } from './sell-dashboard.component';
import { SellSessionStore } from './services/sell-session.store';

describe('SellDashboardComponent', () => {
  let fixture: ComponentFixture<SellDashboardComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SellDashboardComponent, HttpClientTestingModule],
      providers: [
        provideRouter([]),
        SellSessionStore,
        {
          provide: AppConfigService,
          useValue: { settings: { vatRate: 0.15 } },
        },
        {
          provide: AuthService,
          useValue: {
            currentSession: () => ({ displayName: 'Ameer' }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SellDashboardComponent);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    const customerSession = TestBed.inject(CustomerSessionService);
    customerSession.saveFromCreate(
      {
        storeId: '1',
        customerName: 'Saud Ahmed',
        customerNo: '0500000000',
        loginId: '1',
        invoiceNo: '',
        invoiceDate: '18-05-2024',
      },
      {
        status: 'Record Inserted Successfully.',
        message: 'Success',
        responseStatus: '200',
        id: 123,
        invoiceNo: 'INV-001',
        customerNo: '0500000000',
      },
    );
    TestBed.inject(SellSessionStore).selectCreatedCustomer();

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render sell dashboard cards from reference', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Saud Ahmed');
    expect(compiled.textContent).toContain('LATEST PRESCRIPTION');
    expect(compiled.textContent).toContain('Frames');
    expect(compiled.textContent).toContain('CART');
    expect(compiled.textContent).toContain('PAYMENT');
    expect(compiled.textContent).toContain('PAY');
    expect(compiled.textContent).toContain('PAY & PRINT');
    expect(compiled.textContent).toContain('Daily report');
    expect(compiled.textContent).toContain('Open register');
  });

  it('should render latest prescription summary in left panel', async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const leftPanel = compiled.querySelector('.sell-dashboard__panel--left');
    expect(leftPanel?.querySelector('app-latest-prescription-summary')).toBeTruthy();
    expect(leftPanel?.textContent).toContain('LATEST PRESCRIPTION');
    expect(leftPanel?.textContent).toContain('No prescription on file');
    expect(leftPanel?.textContent).toContain('+ New Prescription');
    expect(leftPanel?.textContent).not.toContain('SPH');
  });

  it('should render three dashboard columns', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.sell-dashboard__panel--left')).toBeTruthy();
    expect(compiled.querySelector('.sell-dashboard__panel--middle')).toBeTruthy();
    expect(compiled.querySelector('.sell-dashboard__panel--right')).toBeTruthy();
  });

  it('should navigate to prescription on view prescription', () => {
    fixture.componentInstance['onViewPrescription']();
    expect(router.navigate).toHaveBeenCalledWith(['/home/prescription']);
  });

  it('should dismiss status banner when close is clicked', () => {
    const store = TestBed.inject(SellSessionStore);
    store.statusMessage.set('Prescription history is not connected yet.');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.sell-dashboard__status')).toBeTruthy();

    compiled.querySelector<HTMLButtonElement>('.sell-dashboard__status-close')?.click();
    fixture.detectChanges();

    expect(compiled.querySelector('.sell-dashboard__status')).toBeNull();
    expect(store.statusMessage()).toBe('');
  });
});

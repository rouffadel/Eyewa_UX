import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CustomerProfileCardComponent } from './customer-profile-card.component';
import { Customer } from '../models/customer.models';

describe('CustomerProfileCardComponent', () => {
  let fixture: ComponentFixture<CustomerProfileCardComponent>;

  const sampleCustomer: Customer = {
    id: '123',
    displayName: 'Saud Ahmed',
    initials: 'SA',
    phoneMasked: '0500000000',
    loyaltyPoints: 250,
    lastVisit: '18-05-2024',
    invoiceNo: 'INV-001',
    salesId: 123,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerProfileCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerProfileCardComponent);
  });

  it('should show empty state when customer is null', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Search or select a customer');
    expect(compiled.textContent).toContain('Use the header search');
  });

  it('should show profile fields when customer is set', () => {
    fixture.componentRef.setInput('customer', sampleCustomer);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Saud Ahmed');
    expect(compiled.textContent).toContain('INV-001');
    expect(compiled.textContent).toContain('0500000000');
    expect(compiled.textContent).toContain('Last Visit');
    expect(compiled.textContent).toContain('18-05-2024');
  });

  it('should not render loyalty section until enabled', () => {
    fixture.componentRef.setInput('customer', sampleCustomer);
    fixture.detectChanges();

    const loyalty = (fixture.nativeElement as HTMLElement).querySelector('.customer-card__loyalty');
    expect(loyalty).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Loyalty Balance');
    expect(fixture.nativeElement.textContent).not.toContain('Redeem Points');
  });

  it('should render loyalty section when enabled', () => {
    fixture.componentRef.setInput('customer', sampleCustomer);
    fixture.componentInstance.showLoyaltySection = true;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.customer-card__loyalty')).toBeTruthy();
    expect(compiled.textContent).toContain('Loyalty Balance');
    expect(compiled.textContent).toContain('250 PTS');
  });

  it('should prefer invoiceNo over id', () => {
    fixture.componentRef.setInput('customer', sampleCustomer);
    fixture.detectChanges();

    const idLine = (fixture.nativeElement as HTMLElement).querySelector('.customer-card__id');
    expect(idLine?.textContent?.trim()).toBe('INV-001');
  });

  it('should emit openDetail when header is clicked', () => {
    fixture.componentRef.setInput('customer', sampleCustomer);
    fixture.detectChanges();

    const spy = spyOn(fixture.componentInstance.openDetail, 'emit');
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('.customer-card__header')
      ?.click();

    expect(spy).toHaveBeenCalled();
  });
});

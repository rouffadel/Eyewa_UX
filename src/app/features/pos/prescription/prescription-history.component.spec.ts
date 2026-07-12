import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { PrescriptionHistoryComponent } from './prescription-history.component';
import { SellSessionStore } from '../sell/services/sell-session.store';
import { TEST_CUSTOMER, TEST_PRESCRIPTION } from '../sell/services/sell.test-fixtures';

describe('PrescriptionHistoryComponent', () => {
  let fixture: ComponentFixture<PrescriptionHistoryComponent>;
  let router: Router;
  let selectPrescriptionFromHistory: jasmine.Spy;

  beforeEach(async () => {
    selectPrescriptionFromHistory = jasmine.createSpy('selectPrescriptionFromHistory');

    await TestBed.configureTestingModule({
      imports: [PrescriptionHistoryComponent],
      providers: [
        provideRouter([]),
        {
          provide: SellSessionStore,
          useValue: {
            selectedCustomer: signal(TEST_CUSTOMER),
            selectedPrescriptionId: signal('rx-1'),
            prescriptionHistory: signal([
              { id: 'rx-1', summary: TEST_PRESCRIPTION },
              {
                id: 'rx-2',
                summary: {
                  ...TEST_PRESCRIPTION,
                  date: '22-05-2024',
                  od: { sph: '-2.00', cyl: '-0.50', axis: '90' },
                  os: { sph: '-1.75', cyl: '-0.50', axis: '85' },
                },
              },
            ]),
            prescriptionLoading: signal(false),
            ensureSalesDetailsLoaded: jasmine.createSpy('ensureSalesDetailsLoaded'),
            loadLocalPrescription: jasmine.createSpy('loadLocalPrescription'),
            loadSelectedPrescription: jasmine.createSpy('loadSelectedPrescription'),
            selectPrescriptionFromHistory,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PrescriptionHistoryComponent);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  it('should render saved prescriptions with selection hint', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('PRESCRIPTION HISTORY');
    expect(compiled.textContent).toContain('Select a prescription to view on the Sell dashboard.');
    expect(compiled.textContent).toContain('-1.50');
  });

  it('should select a prescription when an item is clicked', () => {
    const buttons = fixture.nativeElement.querySelectorAll('.prescription-history__item');
    expect(buttons.length).toBe(2);

    (buttons[1] as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.componentInstance['selectedId']()).toBe('rx-2');
    expect(selectPrescriptionFromHistory).toHaveBeenCalledWith('rx-2');
    expect(buttons[1].classList.contains('prescription-history__item--selected')).toBeTrue();
  });

  it('should apply selection and navigate to sell on view', () => {
    fixture.componentInstance['selectedId'].set('rx-2');
    fixture.componentInstance['onViewSelected']();

    expect(selectPrescriptionFromHistory).toHaveBeenCalledWith('rx-2');
    expect(router.navigate).toHaveBeenCalledWith(['/home/sell']);
  });

  it('should navigate back to sell', () => {
    fixture.componentInstance['onBackToSell']();
    expect(router.navigate).toHaveBeenCalledWith(['/home/sell']);
  });
});

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { MeasurementsFormComponent } from './measurements-form.component';
import { MeasurementService } from './services/measurement.service';
import { SellSessionStore } from '../sell/services/sell-session.store';
import { TEST_CUSTOMER } from '../sell/services/sell.test-fixtures';

describe('MeasurementsFormComponent', () => {
  let component: MeasurementsFormComponent;
  let fixture: ComponentFixture<MeasurementsFormComponent>;
  let measurementService: jasmine.SpyObj<MeasurementService>;

  beforeEach(async () => {
    measurementService = jasmine.createSpyObj('MeasurementService', ['getLatest', 'save']);
    measurementService.getLatest.and.returnValue(Promise.resolve(null));
    measurementService.save.and.returnValue(
      Promise.resolve({
        id: 'ms-1',
        customerId: TEST_CUSTOMER.id,
        pd: 62,
        nearPd: 60,
        frameWidth: 138,
        bridgeWidth: 18,
        templeLength: 145,
        lensHeight: 42,
        wrapAngle: 10,
        faceForm: 'Oval',
        frameHeight: 23,
        createdAt: '2024-05-21T10:00:00Z',
        updatedAt: '2024-05-21T10:00:00Z',
      }),
    );

    await TestBed.configureTestingModule({
      imports: [MeasurementsFormComponent],
      providers: [
        { provide: MeasurementService, useValue: measurementService },
        {
          provide: SellSessionStore,
          useValue: {
            selectedCustomer: signal(TEST_CUSTOMER),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MeasurementsFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render all measurement fields and save button', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('MEASUREMENTS');
    expect(compiled.textContent).toContain('PD');
    expect(compiled.textContent).toContain('Near PD');
    expect(compiled.textContent).toContain('Frame Width');
    expect(compiled.textContent).toContain('Bridge Width');
    expect(compiled.textContent).toContain('Temple Length');
    expect(compiled.textContent).toContain('Lens Height');
    expect(compiled.textContent).toContain('Wrap Angle');
    expect(compiled.textContent).toContain('Face Form');
    expect(compiled.textContent).toContain('Frame Height');
    expect(compiled.textContent).toContain('Save Measurements');
  });

  it('should save measurements and enter view mode', fakeAsync(() => {
    component['form'].patchValue({
      pd: 62,
      nearPd: 60,
      frameWidth: 138,
      bridgeWidth: 18,
      templeLength: 145,
      lensHeight: 42,
      wrapAngle: 10,
      faceForm: 'Oval',
      frameHeight: 23,
    });

    component['onSave']();
    tick(500);
    fixture.detectChanges();

    expect(measurementService.save).toHaveBeenCalledWith(
      jasmine.objectContaining({ customerId: TEST_CUSTOMER.id }),
      null,
    );
    expect(component['successMessage']()).toBe('Measurements saved');
    expect(component['isEditing']()).toBeFalse();
  }));

  it('should show edit link after saved record loads', fakeAsync(async () => {
    measurementService.getLatest.and.returnValue(
      Promise.resolve({
        id: 'ms-1',
        customerId: TEST_CUSTOMER.id,
        pd: 62,
        nearPd: 60,
        frameWidth: 138,
        bridgeWidth: 18,
        templeLength: 145,
        lensHeight: 42,
        wrapAngle: 10,
        faceForm: 'Oval',
        frameHeight: 23,
        createdAt: '2024-05-21T10:00:00Z',
        updatedAt: '2024-05-21T10:00:00Z',
      }),
    );

    component['loadLatest']();
    tick();
    fixture.detectChanges();

    expect(component['showEditLink']).toBeTrue();
  }));
});

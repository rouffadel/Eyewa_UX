import { TestBed } from '@angular/core/testing';
import { PrescriptionLocalStorageService } from './prescription-local-storage.service';

describe('PrescriptionLocalStorageService', () => {
  let service: PrescriptionLocalStorageService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [PrescriptionLocalStorageService],
    });
    service = TestBed.inject(PrescriptionLocalStorageService);
  });

  it('should save and load prescription by customer id', () => {
    const record = service.save({
      customerId: '114090',
      salesId: 114090,
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
    });

    expect(service.getLatest('114090')?.id).toBe(record.id);
    expect(service.getHistory('114090').length).toBe(1);
  });

  it('should resolve prescriptions by sales history id alias', () => {
    const record = service.save({
      customerId: '114090',
      salesId: 114090,
      orderLensEnabled: true,
      frames: [],
      lenses: [],
      rightEye: { sph: null, cyl: null, axis: null, add: null },
      leftEye: { sph: null, cyl: null, axis: null, add: null },
      pd: null,
      nearPd: null,
      vd: null,
      notes: '',
    });

    expect(service.getById('114090', record.id)?.id).toBe(record.id);
    expect(service.getById('114090', 'sales-114090')?.id).toBe(record.id);
    expect(service.getById('114090', 'sales-999')).toBeNull();
  });

  it('should remove saved prescriptions for a customer', () => {
    service.save({
      customerId: '114090',
      orderLensEnabled: true,
      frames: [],
      lenses: [],
      rightEye: { sph: null, cyl: null, axis: null, add: null },
      leftEye: { sph: null, cyl: null, axis: null, add: null },
      pd: null,
      nearPd: null,
      vd: null,
      notes: '',
    });

    service.removeForCustomer('114090');

    expect(service.getLatest('114090')).toBeNull();
    expect(service.getLastSaved()).toBeNull();
  });
});

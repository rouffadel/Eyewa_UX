import { TestBed } from '@angular/core/testing';
import { AppConfigService } from '../../../../services/app-config.service';
import { MeasurementService } from './measurement.service';

describe('MeasurementService', () => {
  let service: MeasurementService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MeasurementService,
        {
          provide: AppConfigService,
          useValue: { settings: { apiUrl: 'https://localhost:7207/api' } },
        },
      ],
    });

    service = TestBed.inject(MeasurementService);
  });

  it('should require customerId before save', async () => {
    await expectAsync(
      service.save({
        pd: 62,
        nearPd: 60,
        frameWidth: 138,
        bridgeWidth: 18,
        templeLength: 145,
        lensHeight: 42,
        wrapAngle: 10,
        faceForm: 'Oval',
        frameHeight: 23,
      }),
    ).toBeRejectedWithError('Customer is required to save measurements.');
  });

  it('should return null for empty customerId on getLatest', async () => {
    const latest = await service.getLatest('');
    expect(latest).toBeNull();
  });
});

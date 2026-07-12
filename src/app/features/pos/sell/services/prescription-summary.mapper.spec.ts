import { toPrescriptionSummary, formatPrescriptionSavedAt } from './prescription-summary.mapper';
import { PrescriptionRecord } from '../../prescription/models/prescription.models';

describe('toPrescriptionSummary', () => {
  it('should map saved prescription record to sell summary', () => {
    const record: PrescriptionRecord = {
      id: 'rx-1',
      customerId: 'CUST-000123',
      orderLensEnabled: false,
      frames: [],
      lenses: [],
      rightEye: { sph: -1.5, cyl: -0.75, axis: 180, add: null },
      leftEye: { sph: -1.25, cyl: -1, axis: 175, add: null },
      pd: 62,
      nearPd: 60,
      vd: null,
      notes: '',
      createdAt: '2024-05-21T10:30:00Z',
      updatedAt: '2024-05-21T10:30:00Z',
    };

    const summary = toPrescriptionSummary(record);

    expect(summary.date).toBe('21-05-2024');
    expect(summary.od.sph).toBe('-1.50');
    expect(summary.os.axis).toBe('175');
    expect(summary.pd).toBe('62.0');
    expect(summary.nearPd).toBe('60.0');
  });
});

describe('formatPrescriptionSavedAt', () => {
  it('should format saved timestamp for display', () => {
    const formatted = formatPrescriptionSavedAt('2024-05-21T15:30:00');

    expect(formatted).toMatch(/21-05-2024 at \d{1,2}:30 (AM|PM)/);
  });
});

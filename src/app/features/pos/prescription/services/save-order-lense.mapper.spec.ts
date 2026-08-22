import { buildSaveOrderLensePayload } from './save-order-lense.mapper';

describe('save-order-lense.mapper', () => {
  it('should build SaveOrderLense payload in API format', () => {
    const payload = buildSaveOrderLensePayload({
      customerId: '114039',
      salesId: 117073,
      orderLensEnabled: true,
      frames: [],
      lenses: [
        {
          category: 'CR39',
          orderLens: 'Biua',
          price: 100,
          quantity: 1,
        },
      ],
      rightEye: { sph: 1.25, cyl: 0.75, axis: 4, add: 0.5 },
      leftEye: { sph: 1.25, cyl: 1, axis: 2, add: 0.25 },
      pd: 62,
      nearPd: 60,
      vd: 12,
      notes: 'Test',
    });

    expect(payload).toEqual({
      OrderLenses: [
        {
          OrderLenseId: 0,
          CategoryId: 'CR39',
          Brand: 'Biua',
          Price: '100',
          Quantity: '1',
          Total: 100,
        },
      ],
      PrescriptionDetails: [
        { sph: '+1.25', cyl: '+0.75', axis: '4', add: '0.50' },
        { sph: '+1.25', cyl: '+1.00', axis: '2', add: '0.25' },
      ],
      PrescriptionIpd: {
        sphtext: '1',
        cyltext: '1',
        axistext: '1',
        addtext: '1',
      },
      SalesId: 117073,
    });
  });

  it('should set IPD flags to 0 when eye values are empty', () => {
    const payload = buildSaveOrderLensePayload({
      customerId: '114039',
      salesId: 117073,
      orderLensEnabled: false,
      frames: [],
      lenses: [],
      rightEye: { sph: null, cyl: null, axis: null, add: null },
      leftEye: { sph: null, cyl: null, axis: null, add: null },
      pd: null,
      nearPd: null,
      vd: null,
      notes: '',
    });

    expect(payload.PrescriptionIpd).toEqual({
      sphtext: '0',
      cyltext: '0',
      axistext: '0',
      addtext: '0',
    });
  });
});

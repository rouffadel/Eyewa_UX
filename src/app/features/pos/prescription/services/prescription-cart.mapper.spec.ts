import {
  applyCartItemsToPrescriptionRecord,
  prescriptionLinesToCartItems,
} from './prescription-cart.mapper';
import { PrescriptionRecord } from '../models/prescription.models';

describe('prescriptionLinesToCartItems', () => {
  it('should map saved frames and lenses into cart items', () => {
    const record: PrescriptionRecord = {
      id: 'rx-1',
      customerId: '114090',
      orderLensEnabled: true,
      frames: [
        {
          category: 'Frames - P',
          brandId: 1,
          brandName: 'SQEYEWEAR',
          productId: 12,
          modelNo: 'RTA5008',
          sellingPrice: 390,
          quantity: 1,
          maxDiscount: 75,
          discountPercent: 10,
        },
      ],
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
      createdAt: '2024-05-21T10:00:00Z',
      updatedAt: '2024-05-21T10:00:00Z',
    };

    const items = prescriptionLinesToCartItems(record);

    expect(items.length).toBe(2);
    expect(items[0].product.name).toContain('SQEYEWEAR');
    expect(items[1].product.name).toContain('CR39');
  });

  it('should apply cart quantity changes back to the prescription record', () => {
    const record: PrescriptionRecord = {
      id: 'rx-1',
      customerId: '114090',
      orderLensEnabled: true,
      frames: [
        {
          category: 'Frames - P',
          brandId: 1,
          brandName: 'SQEYEWEAR',
          productId: 12,
          modelNo: 'RTA5008',
          sellingPrice: 390,
          quantity: 1,
          maxDiscount: 75,
          discountPercent: 10,
        },
      ],
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
      createdAt: '2024-05-21T10:00:00Z',
      updatedAt: '2024-05-21T10:00:00Z',
    };

    const cartItems = prescriptionLinesToCartItems(record).map((item, index) =>
      index === 0 ? { ...item, qty: 2, discount: 78 } : item,
    );

    const updated = applyCartItemsToPrescriptionRecord(record, cartItems);

    expect(updated.frames[0].quantity).toBe(2);
    expect(updated.frames[0].discountPercent).toBe(10);
    expect(updated.lenses.length).toBe(1);
  });
});

import {
  calculateFrameLineTotals,
  PrescriptionRecord,
} from '../../prescription/models/prescription.models';
import { lineTotal } from '../models/cart.models';
import { cartItemsFromPrescription } from './prescription-cart.mapper';

describe('cartItemsFromPrescription', () => {
  const baseRecord: PrescriptionRecord = {
    id: 'rx-42',
    customerId: 'cust-1',
    orderLensEnabled: true,
    frames: [
      {
        category: 'Frames - P',
        categoryId: 1,
        brandId: 10,
        brandName: 'SQEYEWEAR',
        productId: 100,
        modelNo: 'RTA5008',
        sellingPrice: 390,
        quantity: 1,
        maxDiscount: 20,
        discountPercent: 10,
      },
    ],
    lenses: [
      {
        category: 'Progressive',
        orderLens: '1.67 Blue Cut',
        price: 250,
        quantity: 2,
      },
    ],
    rightEye: { sph: null, cyl: null, axis: null, add: null },
    leftEye: { sph: null, cyl: null, axis: null, add: null },
    pd: 62,
    nearPd: null,
    vd: null,
    notes: '',
    createdAt: '2024-05-21T10:00:00Z',
    updatedAt: '2024-05-21T10:00:00Z',
  };

  it('maps frame and lens lines to cart items with discounts and totals', () => {
    const items = cartItemsFromPrescription(baseRecord);

    expect(items.length).toBe(2);

    const frame = items[0];
    const frameTotals = calculateFrameLineTotals(390, 1, 10);
    expect(frame.product.name).toBe('SQEYEWEAR RTA5008');
    expect(frame.qty).toBe(1);
    expect(frame.discount).toBe(frameTotals.discountAmount);
    expect(lineTotal(frame)).toBe(frameTotals.totalSellingPrice);

    const lens = items[1];
    expect(lens.product.name).toBe('1.67 Blue Cut');
    expect(lens.qty).toBe(2);
    expect(lineTotal(lens)).toBe(500);
  });

  it('skips lenses when order lens is disabled', () => {
    const items = cartItemsFromPrescription({
      ...baseRecord,
      orderLensEnabled: false,
    });

    expect(items.length).toBe(1);
    expect(items[0].product.category).toBe('frames');
  });
});

import { cartItemsFromOrderLense } from './order-lense.mapper';
import { OrderLenseLine } from '../models/order-lense.models';

describe('cartItemsFromOrderLense', () => {
  const sampleLens: OrderLenseLine = {
    orderLenseId: 65368,
    salesId: 114122,
    category: 'CR39',
    orderLense: 'test',
    price: 100,
    quantity: 2,
    total: 200,
    isActive: true,
    isDeleted: false,
    createdDate: '2026-07-08T21:44:40.853',
  };

  it('should map order lens lines to cart items', () => {
    const items = cartItemsFromOrderLense([sampleLens]);

    expect(items.length).toBe(1);
    expect(items[0].lineId).toBe('order-lens-65368');
    expect(items[0].product.name).toBe('test');
    expect(items[0].product.category).toBe('lenses');
    expect(items[0].qty).toBe(2);
    expect(items[0].unitPrice).toBe(100);
    expect(items[0].variantLabel).toBe('CR39');
  });

  it('should skip inactive or deleted lens lines', () => {
    const items = cartItemsFromOrderLense([
      { ...sampleLens, isDeleted: true },
      { ...sampleLens, orderLenseId: 65369, isActive: false },
    ]);

    expect(items.length).toBe(0);
  });
});

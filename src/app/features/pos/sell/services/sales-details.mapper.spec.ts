import {
  cartItemsFromSalesDetails,
  isOrderCartLocked,
  paymentDraftFromSalesDetails,
} from './sales-details.mapper';
import { SalesDetailsGridLineItem, SalesDetailsPaymentSummary } from '../models/sales-details-grid.models';

describe('sales-details.mapper', () => {
  const sampleLine: SalesDetailsGridLineItem = {
    salesDetailsId: 107386,
    categoryName: 'Sunglasses - M',
    categoryId: 6,
    brandId: 290,
    productId: 12,
    brandName: 'B0NO',
    productName: 'BNS1078',
    sellingPrice: 480,
    productValue: 480,
    quantity: 1,
    maxDiscount: 75,
    discountPercent: 0,
    tax: 0,
    taxPercent: 0,
  };

  it('maps sales line items to cart rows', () => {
    const items = cartItemsFromSalesDetails([sampleLine]);

    expect(items.length).toBe(1);
    expect(items[0].lineId).toBe('sales-107386');
    expect(items[0].product.name).toBe('B0NO BNS1078');
    expect(items[0].qty).toBe(1);
    expect(items[0].unitPrice).toBe(480);
    expect(items[0].discount).toBe(0);
    expect(items[0].variantLabel).toBe('Sunglasses - M');
  });

  it('enables settle-remaining mode when balance is below net total', () => {
    const payment: SalesDetailsPaymentSummary = {
      grossTotal: 480,
      discount: 0,
      netTotal: 480,
      balance: 180,
      totalTax: 0,
      paidAmount: 300,
    };

    expect(paymentDraftFromSalesDetails(payment)).toEqual({
      discountAmount: 0,
      settleRemainingBalance: true,
      payPartial: false,
      partialAmount: 0,
    });
  });

  it('locks cart when partial payment exists on the order', () => {
    expect(
      isOrderCartLocked({
        grossTotal: 480,
        discount: 0,
        netTotal: 480,
        balance: 180,
        totalTax: 0,
        paidAmount: 300,
      }),
    ).toBeTrue();
  });

  it('does not lock cart when no payment has been received yet', () => {
    expect(
      isOrderCartLocked({
        grossTotal: 480,
        discount: 0,
        netTotal: 480,
        balance: 480,
        totalTax: 0,
        paidAmount: null,
      }),
    ).toBeFalse();
  });

  it('does not enable partial payment when balance is zero', () => {
    const payment: SalesDetailsPaymentSummary = {
      grossTotal: 480,
      discount: 0,
      netTotal: 480,
      balance: 0,
      totalTax: 0,
      paidAmount: 480,
    };

    expect(paymentDraftFromSalesDetails(payment)).toEqual({
      discountAmount: 0,
      settleRemainingBalance: false,
      payPartial: false,
      partialAmount: 0,
    });
  });
});

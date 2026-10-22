import {
  cartItemsFromSalesDetails,
  isOrderCartLocked,
  isOrderFullyPaid,
  paymentDraftFromSalesDetails,
} from './sales-details.mapper';
import { lineTotal } from '../models/cart.models';
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

  it('correctly maps 370 frame with 250 sale price (32.43% discount) to exact 120 discount and 250 total', () => {
    const discountedLine: SalesDetailsGridLineItem = {
      ...sampleLine,
      salesDetailsId: 107387,
      productValue: 370,
      sellingPrice: 250,
      quantity: 1,
      discountPercent: 32.43,
    };

    const items = cartItemsFromSalesDetails([discountedLine]);

    expect(items.length).toBe(1);
    expect(items[0].unitPrice).toBe(370);
    expect(items[0].discount).toBe(120);
    expect(lineTotal(items[0])).toBe(250);
  });

  it('correctly maps 250 frame with 170 sale price and 80 SAR discount to exact 80 discount and 170 total', () => {
    const discountedLine: SalesDetailsGridLineItem = {
      ...sampleLine,
      salesDetailsId: 109375,
      productValue: 250,
      sellingPrice: 170,
      quantity: 1,
      discountPercent: 80,
    };

    const items = cartItemsFromSalesDetails([discountedLine]);

    expect(items.length).toBe(1);
    expect(items[0].unitPrice).toBe(250);
    expect(items[0].discount).toBe(80);
    expect(lineTotal(items[0])).toBe(170);
  });

  it('enables settle-remaining mode when balance is below net total', () => {
    const payment: SalesDetailsPaymentSummary = {
      grossTotal: 480,
      discount: 0,
      netTotal: 480,
      balance: 180,
      totalTax: 0,
      paidAmount: 300,
      insuranceAmount: 0,
    };

    expect(paymentDraftFromSalesDetails(payment)).toEqual({
      discountAmount: 0,
      settleRemainingBalance: false,
      partialAmount: 0,
      cashAmount: 0,
      cardAmount: 0,
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
        insuranceAmount: 0,
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
        insuranceAmount: 0,
      }),
    ).toBeFalse();
  });

  it('detects fully paid orders when balance is zero', () => {
    expect(
      isOrderFullyPaid({
        grossTotal: 480,
        discount: 0,
        netTotal: 480,
        balance: 0,
        totalTax: 0,
        paidAmount: 480,
        insuranceAmount: 0,
      }),
    ).toBeTrue();
  });

  it('does not treat unpaid orders as fully paid', () => {
    expect(
      isOrderFullyPaid({
        grossTotal: 480,
        discount: 0,
        netTotal: 480,
        balance: 180,
        totalTax: 0,
        paidAmount: 300,
        insuranceAmount: 0,
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
      insuranceAmount: 0,
    };

    expect(paymentDraftFromSalesDetails(payment)).toEqual({
      discountAmount: 0,
      settleRemainingBalance: false,
      partialAmount: 0,
      cashAmount: 0,
      cardAmount: 0,
    });
  });
});

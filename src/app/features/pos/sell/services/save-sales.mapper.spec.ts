import { DEFAULT_PAYMENT_DRAFT } from '../models/payment.models';
import { buildSaveSalesDetailsPayload } from './save-sales.mapper';

describe('buildSaveSalesDetailsPayload', () => {
  it('should map saved prescription frames and partial payment to SaveSalesDetails payload', () => {
    const payload = buildSaveSalesDetailsPayload({
      customer: {
        id: '116062',
        displayName: 'Mobark',
        initials: 'MO',
        phoneMasked: '0546388847',
        phone: '0546388847',
        loyaltyPoints: 0,
        lastVisit: '7-7-2026',
        salesId: 116062,
      },
      record: {
        id: 'rx-1',
        customerId: '116062',
        salesId: 116062,
        orderLensEnabled: true,
        frames: [
          {
            category: 'Frames - S',
            categoryId: 6,
            brandId: 8,
            brandName: 'SQEYEWEAR',
            productId: 12,
            modelNo: 'RTA5008',
            sellingPrice: 480,
            quantity: 2,
            maxDiscount: 75,
            discountPercent: 10,
          },
        ],
        lenses: [],
        rightEye: { sph: 1, cyl: 0, axis: 180, add: 2 },
        leftEye: { sph: 1, cyl: 0, axis: 180, add: 2 },
        pd: 62,
        nearPd: 60,
        vd: null,
        notes: '',
        createdAt: '2026-07-07T00:00:00.000Z',
        updatedAt: '2026-07-07T00:00:00.000Z',
      },
      storeId: '2',
      salesManId: 0,
      payable: 1000,
      draft: {
        ...DEFAULT_PAYMENT_DRAFT,
        payPartial: true,
        partialAmount: 500,
      },
    });

    expect(payload).toEqual({
      SalesId: 116062,
      StoreId: '2',
      SalesGrids: [
        {
          SalesDetailId: 116062,
          CategoryId: 6,
          BrandId: 8,
          ProductId: 12,
          ProductValue: 480,
          Quantity: '2',
          Discount: 96,
          SellingPrice: '864.00',
          Tax: 0,
          TaxPer: 0,
        },
      ],
      GrossTotal: 960,
      Discount: 96,
      Tax: '0',
      NetTotal: '864.00',
      Balance: '364.00',
      PaidAmount: 500,
      AdvancePaidAmount: 0,
      PaymentMode: 'Cash',
      CustomerName: 'Mobark',
      CustomerNo: '0546388847',
      SalesManId: 0,
    });
  });

  it('should settle an existing partial order with full cumulative paid amount', () => {
    const orderPayment = {
      grossTotal: 864,
      discount: 96,
      netTotal: 864,
      balance: 364,
      totalTax: 0,
      paidAmount: 500,
    };

    const payload = buildSaveSalesDetailsPayload({
      customer: {
        id: '116062',
        displayName: 'Mobark',
        initials: 'MO',
        phoneMasked: '0546388847',
        phone: '0546388847',
        loyaltyPoints: 0,
        lastVisit: '7-7-2026',
        salesId: 116062,
      },
      record: {
        id: 'rx-1',
        customerId: '116062',
        salesId: 116062,
        orderLensEnabled: true,
        frames: [
          {
            category: 'Frames - S',
            categoryId: 6,
            brandId: 8,
            brandName: 'SQEYEWEAR',
            productId: 12,
            modelNo: 'RTA5008',
            sellingPrice: 480,
            quantity: 2,
            maxDiscount: 75,
            discountPercent: 10,
          },
        ],
        lenses: [],
        rightEye: { sph: 1, cyl: 0, axis: 180, add: 2 },
        leftEye: { sph: 1, cyl: 0, axis: 180, add: 2 },
        pd: 62,
        nearPd: 60,
        vd: null,
        notes: '',
        createdAt: '2026-07-07T00:00:00.000Z',
        updatedAt: '2026-07-07T00:00:00.000Z',
      },
      storeId: '2',
      salesManId: 0,
      payable: 864,
      draft: {
        ...DEFAULT_PAYMENT_DRAFT,
        settleRemainingBalance: true,
        method: 'cash',
        cashAmount: 364,
        cardAmount: 0,
      },
      orderPayment,
    });

    expect(payload.PaidAmount).toBe(864);
    expect(payload.Balance).toBe('0.00');
  });
});

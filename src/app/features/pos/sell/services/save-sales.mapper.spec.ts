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
      loginId: 0,
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
      LoginId: 0,
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
      AdvancePaidAmount: 500,
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
            salesDetailsId: 107390,
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
      loginId: 0,
      salesManId: 0,
      payable: 864,
      draft: {
        ...DEFAULT_PAYMENT_DRAFT,
        payFull: true,
        settleRemainingBalance: true,
        method: 'cash',
        cashAmount: 364,
        cardAmount: 0,
      },
      orderPayment,
    });

    expect(payload.PaidAmount).toBe(864);
    expect(payload.AdvancePaidAmount).toBe(864);
    expect(payload.Balance).toBe('0.00');
    expect(payload.SalesGrids[0].SalesDetailId).toBe(107390);
  });

  it('should send full net total for paid and advance amounts on a new full payment', () => {
    const payload = buildSaveSalesDetailsPayload({
      customer: {
        id: '114125',
        displayName: 'new cust',
        initials: 'NC',
        phoneMasked: '8886453629',
        phone: '8886453629',
        loyaltyPoints: 0,
        lastVisit: '14-07-2026',
        salesId: 114125,
      },
      record: {
        id: 'rx-1',
        customerId: '114125',
        salesId: 114125,
        orderLensEnabled: false,
        frames: [
          {
            category: 'Frames - S',
            categoryId: 6,
            brandId: 8,
            brandName: 'BRAND',
            productId: 15,
            modelNo: 'MODEL',
            sellingPrice: 480,
            quantity: 1,
            maxDiscount: null,
            discountPercent: 0,
          },
        ],
        lenses: [],
        rightEye: { sph: null, cyl: null, axis: null, add: null },
        leftEye: { sph: null, cyl: null, axis: null, add: null },
        pd: null,
        nearPd: null,
        vd: null,
        notes: '',
        createdAt: '2026-07-14T00:00:00.000Z',
        updatedAt: '2026-07-14T00:00:00.000Z',
      },
      storeId: '1',
      loginId: 1,
      salesManId: 1,
      payable: 480,
      draft: {
        ...DEFAULT_PAYMENT_DRAFT,
        payFull: true,
        method: 'cash',
        cashAmount: 480,
        cardAmount: 0,
      },
    });

    expect(payload.PaidAmount).toBe(480);
    expect(payload.AdvancePaidAmount).toBe(480);
    expect(payload.Balance).toBe('0.00');
  });

  it('should settle remaining balance with full net total in paid and advance amounts', () => {
    const orderPayment = {
      grossTotal: 480,
      discount: 0,
      netTotal: 200,
      balance: 280,
      totalTax: 0,
      paidAmount: 200,
    };

    const payload = buildSaveSalesDetailsPayload({
      customer: {
        id: '114125',
        displayName: 'new cust',
        initials: 'NC',
        phoneMasked: '8886453629',
        phone: '8886453629',
        loyaltyPoints: 0,
        lastVisit: '14-07-2026',
        salesId: 114125,
      },
      record: {
        id: 'rx-1',
        customerId: '114125',
        salesId: 114125,
        orderLensEnabled: false,
        frames: [
          {
            category: 'Frames - S',
            categoryId: 6,
            brandId: 8,
            brandName: 'BRAND',
            productId: 15,
            modelNo: 'MODEL',
            sellingPrice: 480,
            quantity: 1,
            maxDiscount: null,
            discountPercent: 0,
          },
        ],
        lenses: [],
        rightEye: { sph: null, cyl: null, axis: null, add: null },
        leftEye: { sph: null, cyl: null, axis: null, add: null },
        pd: null,
        nearPd: null,
        vd: null,
        notes: '',
        createdAt: '2026-07-14T00:00:00.000Z',
        updatedAt: '2026-07-14T00:00:00.000Z',
      },
      storeId: '1',
      loginId: 1,
      salesManId: 1,
      payable: 280,
      draft: {
        ...DEFAULT_PAYMENT_DRAFT,
        payFull: true,
        settleRemainingBalance: true,
        method: 'cash',
        cashAmount: 280,
        cardAmount: 0,
      },
      orderPayment,
    });

    expect(payload.PaidAmount).toBe(480);
    expect(payload.AdvancePaidAmount).toBe(480);
    expect(payload.Balance).toBe('0.00');
    expect(payload.NetTotal).toBe('480.00');
  });
});

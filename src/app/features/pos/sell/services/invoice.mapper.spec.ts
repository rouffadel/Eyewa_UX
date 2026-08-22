import { buildInvoiceFromExistingOrder, buildInvoiceViewModel } from './invoice.mapper';
import { DEFAULT_PAYMENT_DRAFT } from '../models/payment.models';
import { TEST_CUSTOMER } from './sell.test-fixtures';

describe('buildInvoiceViewModel', () => {
  it('should map header, totals, and cart fallback lines', () => {
    const invoice = buildInvoiceViewModel({
      customer: { ...TEST_CUSTOMER, invoiceNo: 'INV-100', phone: '0505937411' },
      cartItems: [
        {
          lineId: 'line-1',
          product: {
            sku: 'FRM-0001',
            name: 'Ray-Ban RB 2140',
            price: 390,
            category: 'frames',
          },
          qty: 1,
          unitPrice: 390,
          discount: 140,
        },
      ],
      paymentTotals: {
        subtotal: 250,
        discount: 0,
        vat: 0,
        total: 250,
        loyaltyDeduction: 0,
        insuranceAmount: 0,
        insuranceCompensation: 0,
        insuranceCompensationType: null,
        payable: 250,
      },
      paymentDraft: {
        ...DEFAULT_PAYMENT_DRAFT,
        method: 'cash',
        cashAmount: 250,
        cardAmount: 0,
        partialAmount: 250,
      },
      prescriptionRecord: null,
      latestPrescription: null,
      staffName: 'Ameer',
    });

    expect(invoice.invoiceNo).toBe('INV-100');
    expect(invoice.customerName).toBe('Saud Ahmed');
    expect(invoice.contactNo).toBe('0505937411');
    expect(invoice.productLines).toHaveSize(1);
    expect(invoice.productLines[0].brand).toBe('Ray-Ban RB 2140');
    expect(invoice.subtotal).toContain('250');
    expect(invoice.total).toContain('250');
    expect(invoice.amountPaid).toContain('250');
    expect(invoice.balance).toContain('0');
    expect(invoice.user).toBe('Ameer');
  });

  it('should prefer prescription frame lines and rx values when available', () => {
    const invoice = buildInvoiceViewModel({
      customer: TEST_CUSTOMER,
      cartItems: [],
      paymentTotals: {
        subtotal: 250,
        discount: 0,
        vat: 0,
        total: 250,
        loyaltyDeduction: 0,
        insuranceAmount: 0,
        insuranceCompensation: 0,
        insuranceCompensationType: null,
        payable: 250,
      },
      paymentDraft: {
        ...DEFAULT_PAYMENT_DRAFT,
        method: 'mixed',
        cashAmount: 650,
        cardAmount: 60,
        partialAmount: 710,
      },
      prescriptionRecord: {
        id: 'rx-1',
        customerId: TEST_CUSTOMER.id,
        createdAt: '2026-06-23T00:00:00.000Z',
        updatedAt: '2026-06-23T00:00:00.000Z',
        orderLensEnabled: false,
        frames: [
          {
            category: 'Frames - P',
            brandId: 42,
            brandName: 'SQEYEWEAR',
            productId: 99,
            modelNo: 'RTA5008',
            sellingPrice: 390,
            quantity: 1,
            maxDiscount: 75,
            discountPercent: 35.9,
          },
        ],
        lenses: [],
        rightEye: { sph: -2.75, cyl: 0, axis: 0, add: 2.5 },
        leftEye: { sph: 1.25, cyl: -2, axis: 90, add: 2.5 },
        pd: 62,
        nearPd: null,
        vd: null,
        notes: 'Progressive lenses',
      },
      latestPrescription: null,
      staffName: 'Staff',
    });

    expect(invoice.productLines[0].brand).toBe('SQEYEWEAR');
    expect(invoice.productLines[0].modelNo).toBe('RTA5008');
    expect(invoice.rxRows[0].sph).toBe('-2.75');
    expect(invoice.rxRows[1].cyl).toBe('-2.00');
    expect(invoice.rxRows[2].sph).toBe('62.0 mc');
    expect(invoice.details).toBe('Progressive lenses');
  });
});

describe('buildInvoiceFromExistingOrder', () => {
  const paymentTotals = {
    subtotal: 480,
    discount: 0,
    vat: 0,
    total: 480,
    loyaltyDeduction: 0,
    insuranceAmount: 0,
    insuranceCompensation: 0,
    insuranceCompensationType: null,
    payable: 480,
  };

  it('should build a zero-balance receipt from loaded sales details', () => {
    const invoice = buildInvoiceFromExistingOrder({
      customer: { ...TEST_CUSTOMER, invoiceNo: 'NAB-14072026-28766' },
      cartItems: [
        {
          lineId: 'sales-107390',
          product: {
            sku: 'sales-product-15',
            name: 'Bono BNS1073',
            price: 480,
            category: 'frames',
          },
          qty: 1,
          unitPrice: 480,
          discount: 0,
          variantLabel: 'Sunglasses - M',
        },
      ],
      orderPayment: {
        grossTotal: 480,
        discount: 0,
        netTotal: 480,
        balance: 0,
        totalTax: 0,
        paidAmount: 480,
        insuranceAmount: 0,
      },
      paymentTotals,
      paymentDraft: {
        ...DEFAULT_PAYMENT_DRAFT,
        method: 'cash',
        cashAmount: 480,
        partialAmount: 480,
      },
      prescriptionRecord: null,
      latestPrescription: null,
      staffName: 'Ameer',
      invoiceDate: '2026-07-14',
      qrcodeImg: 'data:image/png;base64,invoice-qr',
    });

    expect(invoice.invoiceNo).toBe('NAB-14072026-28766');
    expect(invoice.invoiceDate).toBe('2026-07-14');
    expect(invoice.subtotal).toBe('480.00');
    expect(invoice.vat).toBe('0.00');
    expect(invoice.total).toBe('480.00');
    expect(invoice.amountPaid).toBe('480.00');
    expect(invoice.balance).toBe('0.00');
    expect(invoice.productLines[0].brand).toBe('Bono BNS1073');
    expect(invoice.qrcodeImg).toBe('data:image/png;base64,invoice-qr');
    expect(invoice.previouslyPaid).toBeUndefined();
  });

  it('should use table2 PaidAmount for amount paid on fully settled receipts', () => {
    const invoice = buildInvoiceFromExistingOrder({
      customer: { ...TEST_CUSTOMER, invoiceNo: 'NAB-14072026-28768' },
      cartItems: [],
      orderPayment: {
        grossTotal: 380,
        discount: 0,
        netTotal: 380,
        balance: 0,
        totalTax: 0,
        paidAmount: 580,
        insuranceAmount: 0,
      },
      paymentTotals: {
        subtotal: 380,
        discount: 0,
        vat: 0,
        total: 380,
        loyaltyDeduction: 0,
        insuranceAmount: 0,
        insuranceCompensation: 0,
        insuranceCompensationType: null,
        payable: 380,
      },
      paymentDraft: {
        ...DEFAULT_PAYMENT_DRAFT,
        method: 'cash',
        cashAmount: 380,
        partialAmount: 380,
      },
      prescriptionRecord: null,
      latestPrescription: null,
      staffName: 'Ameer',
    });

    expect(invoice.amountPaid).toBe('580.00');
    expect(invoice.partialAmount).toBe('380.00');
    expect(invoice.balance).toBe('0.00');
  });

  it('should show previously paid amount on partial order receipts', () => {
    const invoice = buildInvoiceFromExistingOrder({
      customer: { ...TEST_CUSTOMER, invoiceNo: 'NAB-08072026-28763' },
      cartItems: [],
      orderPayment: {
        grossTotal: 480,
        discount: 0,
        netTotal: 480,
        balance: 180,
        totalTax: 0,
        paidAmount: 300,
        insuranceAmount: 0,
      },
      paymentTotals: {
        subtotal: 480,
        discount: 0,
        vat: 0,
        total: 480,
        loyaltyDeduction: 0,
        insuranceAmount: 0,
        insuranceCompensation: 0,
        insuranceCompensationType: null,
        payable: 480,
      },
      paymentDraft: {
        ...DEFAULT_PAYMENT_DRAFT,
        method: 'cash',
        cashAmount: 300,
        partialAmount: 300,
      },
      prescriptionRecord: null,
      latestPrescription: null,
      staffName: 'Ameer',
    });

    expect(invoice.previouslyPaid).toBe('300.00');
    expect(invoice.amountPaid).toBe('300.00');
    expect(invoice.balance).toBe('180.00');
    expect(invoice.paidThisTime).toBeUndefined();
  });
});

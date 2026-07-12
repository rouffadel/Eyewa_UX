import { buildInvoiceViewModel } from './invoice.mapper';
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
        payable: 250,
      },
      paymentDraft: {
        ...DEFAULT_PAYMENT_DRAFT,
        method: 'cash',
        cashAmount: 250,
        cardAmount: 0,
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
    expect(invoice.totalAmount).toContain('250');
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
        payable: 250,
      },
      paymentDraft: {
        ...DEFAULT_PAYMENT_DRAFT,
        method: 'mixed',
        cashAmount: 650,
        cardAmount: 60,
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

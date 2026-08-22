import { TestBed } from '@angular/core/testing';
import { AppConfigService } from '../../../../services/app-config.service';
import { DEFAULT_PAYMENT_DRAFT } from '../models/payment.models';
import { formatMoney, hasNegativeCartValues, hasNegativePaymentDraftValues, mixedBalanceRemaining, paymentAmountPaid, paymentBalanceRemaining, PaymentService, resolveInvoicePartialAmount, resolveInvoicePaymentBreakdown, shouldConfirmNegativePaymentValues } from './payment.service';

describe('PaymentService', () => {
  let service: PaymentService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PaymentService,
        {
          provide: AppConfigService,
          useValue: { settings: { vatRate: 0.15 } },
        },
      ],
    });

    service = TestBed.inject(PaymentService);
  });

  it('should calculate totals matching reference example', () => {
    const totals = service.calculateTotals(1100, {
      ...DEFAULT_PAYMENT_DRAFT,
      discountAmount: 0,
      redeemLoyalty: true,
      loyaltyPoints: 100,
    });

    expect(totals.subtotal).toBe(1100);
    expect(totals.vat).toBeCloseTo(165, 2);
    expect(totals.total).toBeCloseTo(1265, 2);
    expect(totals.loyaltyDeduction).toBe(100);
    expect(totals.insuranceAmount).toBe(0);
    expect(totals.payable).toBeCloseTo(1165, 2);
  });

  it('should deduct insurance percentage from payable when insurance is present', () => {
    // Bill total after VAT = 100, insurance 5% => deduct 5, payable 95
    const totals = service.calculateTotals(
      100 / 1.15,
      {
        ...DEFAULT_PAYMENT_DRAFT,
        discountAmount: 0,
        redeemLoyalty: false,
        loyaltyPoints: 0,
      },
      5,
      'percentage',
    );

    expect(totals.total).toBeCloseTo(100, 2);
    expect(totals.insuranceCompensation).toBe(5);
    expect(totals.insuranceCompensationType).toBe('percentage');
    expect(totals.insuranceAmount).toBeCloseTo(5, 2);
    expect(totals.payable).toBeCloseTo(95, 2);
  });

  it('should apply discount before VAT', () => {
    const totals = service.calculateTotals(1100, {
      ...DEFAULT_PAYMENT_DRAFT,
      discountAmount: 100,
      redeemLoyalty: false,
      loyaltyPoints: 0,
    });

    expect(totals.discount).toBe(100);
    expect(totals.vat).toBeCloseTo(150, 2);
    expect(totals.total).toBeCloseTo(1150, 2);
  });

  it('should default loyalty redemption to off with zero points', () => {
    expect(service.defaultDraft()).toEqual({
      discountAmount: 0,
      redeemLoyalty: false,
      loyaltyPoints: 0,
      method: 'cash',
      cashAmount: 0,
      cardAmount: 0,
      partialAmount: 0,
      applyInsurance: true,
      settleRemainingBalance: false,
      deliveryDate: null,
    });
  });

  it('should sync full cash and card amounts', () => {
    expect(service.syncAmountsForMethod(1165, 'cash', DEFAULT_PAYMENT_DRAFT)).toEqual({
      cashAmount: 1165,
      cardAmount: 0,
      partialAmount: 0,
    });

    expect(service.syncAmountsForMethod(1165, 'card', DEFAULT_PAYMENT_DRAFT)).toEqual({
      cashAmount: 0,
      cardAmount: 1165,
      partialAmount: 0,
    });
  });

  it('should split mixed amounts without auto-balancing the other field', () => {
    const initial = service.syncAmountsForMethod(1000, 'mixed', {
      ...DEFAULT_PAYMENT_DRAFT,
      method: 'cash',
    });

    expect(initial.cashAmount).toBe(500);
    expect(initial.cardAmount).toBe(500);

    const updatedCash = service.applyMixedCashAmount(1000, 650);
    expect(updatedCash).toEqual({ cashAmount: 650 });

    const updatedCard = service.applyMixedCardAmount(1000, 60);
    expect(updatedCard).toEqual({ cardAmount: 60 });
  });

  it('should calculate mixed balance remaining', () => {
    const draft = {
      ...DEFAULT_PAYMENT_DRAFT,
      method: 'mixed' as const,
      cashAmount: 650,
      cardAmount: 60,
    };

    expect(service.calculateTotals(1100, draft).payable).toBeCloseTo(1265, 2);
    expect(mixedBalanceRemaining(1265, draft)).toBeCloseTo(555, 2);
  });

  it('should validate payment completion by method', () => {
    const payable = 1165;

    expect(
      service.isPaymentComplete(payable, {
        ...DEFAULT_PAYMENT_DRAFT,
        method: 'cash',
        cashAmount: 1165,
        cardAmount: 0,
      }),
    ).toBeTrue();

    expect(
      service.isPaymentComplete(payable, {
        ...DEFAULT_PAYMENT_DRAFT,
        method: 'card',
        cashAmount: 0,
        cardAmount: 1165,
      }),
    ).toBeTrue();

    expect(
      service.isPaymentComplete(payable, {
        ...DEFAULT_PAYMENT_DRAFT,
        method: 'mixed',
        cashAmount: 400,
        cardAmount: 765,
      }),
    ).toBeTrue();

    expect(
      service.isPaymentComplete(payable, {
        ...DEFAULT_PAYMENT_DRAFT,
        method: 'mixed',
        cashAmount: 1165,
        cardAmount: 0,
      }),
    ).toBeFalse();
  });

  it('should allow a valid partial payment with remaining balance', () => {
    const draft = {
      ...DEFAULT_PAYMENT_DRAFT,
      partialAmount: 500,
    };

    expect(service.isPaymentComplete(1000, draft)).toBeTrue();
    expect(service.paymentValidationMessage(1000, draft)).toBeNull();
  });

  it('should validate settling the remaining balance on an existing order', () => {
    const orderPayment = {
      grossTotal: 480,
      discount: 0,
      netTotal: 480,
      balance: 180,
      totalTax: 0,
      paidAmount: 300,
      insuranceAmount: 0,
    };
    const draft = {
      ...DEFAULT_PAYMENT_DRAFT,
      settleRemainingBalance: true,
      method: 'cash' as const,
      cashAmount: 180,
      cardAmount: 0,
    };

    expect(service.isPaymentComplete(480, draft, orderPayment)).toBeTrue();
    expect(service.paymentValidationMessage(480, draft, orderPayment)).toBeNull();
    expect(paymentAmountPaid(480, draft, orderPayment)).toBe(480);
    expect(paymentBalanceRemaining(480, draft, orderPayment)).toBe(0);
  });

  it('should format money with thousands separator', () => {
    expect(formatMoney(1165)).toBe('1,165.00');
  });

  it('should detect negative cart prices, discounts, and line totals', () => {
    expect(
      hasNegativeCartValues([
        {
          lineId: 'line-1',
          product: { sku: '1', name: 'Frame', price: 100, category: 'frames' },
          qty: 1,
          unitPrice: -50,
          discount: 0,
        },
      ]),
    ).toBeTrue();

    expect(
      hasNegativeCartValues([
        {
          lineId: 'line-2',
          product: { sku: '2', name: 'Frame', price: 100, category: 'frames' },
          qty: 1,
          unitPrice: 100,
          discount: 150,
        },
      ]),
    ).toBeTrue();
  });

  it('should detect negative payment discount and totals', () => {
    const totals = service.calculateTotals(100, {
      ...DEFAULT_PAYMENT_DRAFT,
      discountAmount: -10,
    });

    expect(hasNegativePaymentDraftValues({ ...DEFAULT_PAYMENT_DRAFT, discountAmount: -10 }, totals)).toBeTrue();
  });

  it('should require confirmation when negative values are present', () => {
    const totals = service.calculateTotals(100, DEFAULT_PAYMENT_DRAFT);

    expect(
      shouldConfirmNegativePaymentValues(
        [
          {
            lineId: 'line-1',
            product: { sku: '1', name: 'Frame', price: 100, category: 'frames' },
            qty: 1,
            unitPrice: -1,
            discount: 0,
          },
        ],
        totals,
        DEFAULT_PAYMENT_DRAFT,
        null,
      ),
    ).toBeTrue();

    expect(shouldConfirmNegativePaymentValues([], totals, DEFAULT_PAYMENT_DRAFT, null)).toBeFalse();
  });

  it('should split previously paid and paid this time for settlement receipts', () => {
    expect(
      resolveInvoicePaymentBreakdown(480, 0, {
        grossTotal: 480,
        discount: 0,
        netTotal: 480,
        balance: 180,
        totalTax: 0,
        paidAmount: 300,
        insuranceAmount: 0,
      }),
    ).toEqual({
      previouslyPaid: 300,
      paidThisTime: 180,
      totalPaid: 480,
      balance: 0,
    });
  });

  it('should prefer table2 PaidAmount when reprinting a fully paid order', () => {
    expect(
      resolveInvoicePaymentBreakdown(380, 0, null, {
        treatOutstandingAsPreviouslyPaid: true,
        orderPayment: {
          grossTotal: 380,
          discount: 0,
          netTotal: 380,
          balance: 0,
          totalTax: 0,
          paidAmount: 580,
          insuranceAmount: 0,
        },
      }),
    ).toEqual({
      previouslyPaid: 0,
      paidThisTime: 580,
      totalPaid: 580,
      balance: 0,
    });
  });

  it('should expose header partial amount when table2 paid differs', () => {
    expect(
      resolveInvoicePartialAmount(null, {
        grossTotal: 380,
        discount: 0,
        netTotal: 380,
        balance: 0,
        totalTax: 0,
        paidAmount: 580,
        insuranceAmount: 0,
      }),
    ).toBe(380);
  });
});

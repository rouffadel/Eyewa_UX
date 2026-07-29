import { Injectable } from '@angular/core';
import { AppConfigService } from '../../../../services/app-config.service';
import {
  PrescriptionRecord,
} from '../../prescription/models/prescription.models';
import { CartLineItem, lineTotal } from '../models/cart.models';
import {
  DEFAULT_PAYMENT_DRAFT,
  PaymentDraft,
  PaymentMethod,
  PaymentTotals,
} from '../models/payment.models';
import { SalesDetailsPaymentSummary } from '../models/sales-details-grid.models';

const AMOUNT_EPSILON = 0.01;

export const NEGATIVE_PAYMENT_CONFIRM_MESSAGE =
  'This order has negative prices or discounts. Do you still want to pay?';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  constructor(private readonly appConfig: AppConfigService) {}

  calculateTotals(
    subtotal: number,
    draft: PaymentDraft,
    insuranceCompensation: number | null = null,
    insuranceCompensationType: 'percentage' | 'amount' | null = null,
  ): PaymentTotals {
    const discount = Math.max(0, draft.discountAmount);
    const afterDiscount = Math.max(0, subtotal - discount);
    const vatRate = 0; // Temporarily forced to 0% as requested
    const vat = afterDiscount * vatRate;
    const total = afterDiscount + vat;
    const loyaltyDeduction =
      draft.redeemLoyalty && draft.loyaltyPoints > 0
        ? Math.min(draft.loyaltyPoints, total)
        : 0;
    const afterLoyalty = Math.max(0, total - loyaltyDeduction);
    
    let insuranceAmount = 0;
    const compensation = insuranceCompensation != null && Number.isFinite(insuranceCompensation) ? Math.max(0, insuranceCompensation) : 0;
    const compensationType = insuranceCompensationType || 'percentage';

    if (compensation > 0) {
      if (compensationType === 'amount') {
        insuranceAmount = Math.min(afterLoyalty, compensation);
      } else {
        insuranceAmount = Math.round(((afterLoyalty * compensation) / 100) * 100) / 100;
      }
    }
    
    const payable = Math.max(0, afterLoyalty - insuranceAmount);

    return {
      subtotal,
      discount,
      vat,
      total,
      loyaltyDeduction,
      insuranceAmount,
      insuranceCompensation: compensation,
      insuranceCompensationType: compensationType,
      payable,
    };
  }

  defaultDraft(): PaymentDraft {
    return { ...DEFAULT_PAYMENT_DRAFT };
  }

  syncAmountsForMethod(
    payable: number,
    method: PaymentMethod,
    draft: PaymentDraft,
    orderPayment?: SalesDetailsPaymentSummary | null,
  ): Pick<PaymentDraft, 'cashAmount' | 'cardAmount' | 'partialAmount'> {
    // Default to 0 as requested by user instead of the full payable amount
    const amount = Math.max(0, draft.partialAmount);

    if (method === 'mixed') {
      if (draft.method !== 'mixed') {
        const half = Math.round((amount / 2) * 100) / 100;
        return {
          cashAmount: half,
          cardAmount: Math.max(0, amount - half),
          partialAmount: amount,
        };
      }
      return {
        cashAmount: Math.max(0, draft.cashAmount),
        cardAmount: Math.max(0, draft.cardAmount),
        partialAmount: draft.partialAmount,
      };
    }

    return {
      ...this.partialAmountsForMethod(method, amount),
      partialAmount: amount,
    };
  }

  applyMixedCashAmount(_payable: number, cashAmount: number): Pick<PaymentDraft, 'cashAmount'> {
    return {
      cashAmount: this.clampNonNegative(cashAmount),
    };
  }

  applyMixedCardAmount(_payable: number, cardAmount: number): Pick<PaymentDraft, 'cardAmount'> {
    return {
      cardAmount: this.clampNonNegative(cardAmount),
    };
  }

  isPaymentComplete(payable: number, draft: PaymentDraft, orderPayment?: SalesDetailsPaymentSummary | null): boolean {
    const normalizedPayable = Math.max(0, payable);

    if (normalizedPayable === 0 && !draft.settleRemainingBalance) {
      return false;
    }

    const amount = draft.method === 'mixed' 
      ? mixedAmountPaid(draft)
      : Math.max(0, draft.partialAmount);

    if (draft.settleRemainingBalance) {
      const due = settlementAmountDue(payable, draft, orderPayment);
      if (due <= 0) {
        return false;
      }

      return this.amountsEqual(amount, due);
    }

    return this.amountsEqual(amount, normalizedPayable);
  }

  isPartialPayment(payable: number, draft: PaymentDraft, orderPayment?: SalesDetailsPaymentSummary | null): boolean {
    const normalizedPayable = Math.max(0, payable);

    if (normalizedPayable === 0 && !draft.settleRemainingBalance) {
      return false;
    }

    const amount = draft.method === 'mixed' 
      ? mixedAmountPaid(draft)
      : Math.max(0, draft.partialAmount);

    if (draft.settleRemainingBalance) {
      const due = settlementAmountDue(payable, draft, orderPayment);
      if (due <= 0) {
        return false;
      }

      return amount > 0 && amount < due;
    }

    return amount > 0 && amount < normalizedPayable;
  }

  paymentValidationMessage(
    payable: number,
    draft: PaymentDraft,
    orderPayment?: SalesDetailsPaymentSummary | null,
  ): string | null {
    if (draft.method === 'more') {
      return 'Select Cash, Card, or Mixed to continue.';
    }

    const amount = draft.method === 'mixed' 
      ? mixedAmountPaid(draft)
      : Math.max(0, draft.partialAmount);

    if (amount <= 0) {
      return draft.method === 'mixed' ? 'Enter cash and card amounts.' : 'Enter the payment amount.';
    }

    if (draft.settleRemainingBalance) {
      const due = settlementAmountDue(payable, draft, orderPayment);
      if (due <= 0) {
        return 'No remaining balance to pay.';
      }

      if (amount > due) {
        return 'Payment amount cannot exceed the remaining balance.';
      }

      return null;
    }

    const normalizedPayable = Math.max(0, payable);

    if (amount > normalizedPayable) {
      return 'Payment amount cannot exceed the payable amount.';
    }

    return null;
  }

  private clampAmount(value: number, max: number): number {
    if (!Number.isFinite(value)) {
      return 0;
    }

    return Math.max(0, Math.min(max, value));
  }

  private clampNonNegative(value: number): number {
    if (!Number.isFinite(value)) {
      return 0;
    }

    return Math.max(0, value);
  }

  private amountsEqual(left: number, right: number): boolean {
    return Math.abs(left - right) <= AMOUNT_EPSILON;
  }

  private partialAmountsForMethod(
    method: PaymentMethod,
    partialAmount: number,
  ): Pick<PaymentDraft, 'cashAmount' | 'cardAmount'> {
    const amount = this.clampNonNegative(partialAmount);

    if (method === 'card') {
      return { cashAmount: 0, cardAmount: amount };
    }

    if (method === 'mixed') {
      return { cashAmount: amount, cardAmount: 0 };
    }

    return { cashAmount: amount, cardAmount: 0 };
  }
}

export function formatMoney(value: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function settlementAmountDue(
  payable: number,
  draft: PaymentDraft,
  orderPayment?: SalesDetailsPaymentSummary | null,
): number {
  if (draft.settleRemainingBalance && orderPayment) {
    const alreadyPaid = orderAmountAlreadyPaid(orderPayment);
    return Math.max(0, payable - alreadyPaid);
  }

  if (draft.method !== 'mixed' && draft.partialAmount > 0) {
    return Math.max(0, draft.partialAmount);
  }

  return Math.max(0, payable);
}

export function orderAmountAlreadyPaid(orderPayment: SalesDetailsPaymentSummary | null): number {
  if (!orderPayment) {
    return 0;
  }

  const apiPaid = orderPayment.paidAmount;
  if (apiPaid != null && !Number.isNaN(apiPaid)) {
    return Math.max(0, apiPaid);
  }

  const netTotal = Math.max(0, orderPayment.netTotal);
  const balance = Math.max(0, orderPayment.balance);
  return Math.max(0, netTotal - balance);
}

export function orderTotalPaidFromSummary(
  netTotal: number,
  balance: number,
  orderPayment?: SalesDetailsPaymentSummary | null,
): number {
  const derived = Math.max(0, Math.max(0, netTotal) - Math.max(0, balance));
  const apiPaid = orderPayment?.paidAmount;
  if (apiPaid != null && !Number.isNaN(apiPaid)) {
    return Math.max(derived, Math.max(0, apiPaid));
  }

  return derived;
}

export function resolveInvoicePartialAmount(
  paymentDraft: PaymentDraft | null | undefined,
  orderPayment: SalesDetailsPaymentSummary | null | undefined,
): number | undefined {
  if (paymentDraft?.partialAmount && paymentDraft.partialAmount > 0) {
    return paymentDraft.partialAmount;
  }

  if (!orderPayment) {
    return undefined;
  }

  const netTotal = Math.max(0, orderPayment.netTotal);
  const balance = Math.max(0, orderPayment.balance);
  const headerPaid = Math.max(0, netTotal - balance);
  const apiPaid = orderPayment.paidAmount;

  if (apiPaid != null && !Number.isNaN(apiPaid) && Math.abs(apiPaid - headerPaid) > 0.01) {
    return headerPaid;
  }

  return undefined;
}

export interface InvoicePaymentBreakdown {
  previouslyPaid: number;
  paidThisTime: number;
  totalPaid: number;
  balance: number;
}

export function resolveInvoicePaymentBreakdown(
  netTotal: number,
  balance: number,
  previousOrderPayment: SalesDetailsPaymentSummary | null = null,
  options: {
    treatOutstandingAsPreviouslyPaid?: boolean;
    orderPayment?: SalesDetailsPaymentSummary | null;
  } = {},
): InvoicePaymentBreakdown {
  const normalizedNetTotal = Math.max(0, netTotal);
  const normalizedBalance = Math.max(0, balance);
  const currentOrder = options.orderPayment ?? null;
  const totalPaid = orderTotalPaidFromSummary(
    normalizedNetTotal,
    normalizedBalance,
    currentOrder,
  );

  let previouslyPaid = 0;
  if (previousOrderPayment) {
    previouslyPaid = orderAmountAlreadyPaid(previousOrderPayment);
  } else if (options.treatOutstandingAsPreviouslyPaid && normalizedBalance > 0) {
    const orderForPreviouslyPaid: SalesDetailsPaymentSummary = currentOrder ?? {
      grossTotal: normalizedNetTotal,
      discount: 0,
      netTotal: normalizedNetTotal,
      balance: normalizedBalance,
      totalTax: 0,
      paidAmount: null,
      insuranceAmount: 0,
    };
    previouslyPaid = orderAmountAlreadyPaid(orderForPreviouslyPaid);
  }

  return {
    previouslyPaid,
    paidThisTime: Math.max(0, totalPaid - previouslyPaid),
    totalPaid,
    balance: normalizedBalance,
  };
}

export function mixedAmountPaid(draft: PaymentDraft): number {
  return Math.max(0, draft.cashAmount) + Math.max(0, draft.cardAmount);
}

export function mixedBalanceRemaining(payable: number, draft: PaymentDraft): number {
  return Math.max(0, Math.max(0, payable) - mixedAmountPaid(draft));
}

export function paymentAmountPaid(
  payable: number,
  draft: PaymentDraft,
  orderPayment?: SalesDetailsPaymentSummary | null,
): number {
  const amount = draft.method === 'mixed'
    ? mixedAmountPaid(draft)
    : Math.max(0, draft.partialAmount);

  if (draft.settleRemainingBalance && orderPayment) {
    const previouslyPaid = orderAmountAlreadyPaid(orderPayment);
    const due = Math.max(0, orderPayment.balance);
    const amountToPayThisTime = Math.min(amount, due);
    return previouslyPaid + amountToPayThisTime;
  }

  return Math.min(Math.max(0, payable), amount);
}

export function paymentBalanceRemaining(
  payable: number,
  draft: PaymentDraft,
  orderPayment?: SalesDetailsPaymentSummary | null,
): number {
  return Math.max(0, Math.max(0, payable) - paymentAmountPaid(payable, draft, orderPayment));
}

export function parsePaymentAmount(value: string | number): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function hasNegativeCartValues(cartItems: CartLineItem[]): boolean {
  return cartItems.some(
    (item) => item.unitPrice < 0 || item.discount < 0 || lineTotal(item) < 0,
  );
}

export function hasNegativePaymentDraftValues(
  draft: PaymentDraft,
  totals: PaymentTotals,
): boolean {
  return (
    draft.discountAmount < 0 ||
    totals.subtotal < 0 ||
    totals.total < 0 ||
    totals.payable < 0
  );
}

export function hasNegativePrescriptionValues(record: PrescriptionRecord): boolean {
  const negativeFrames = record.frames.some((line) => {
    if (line.sellingPrice != null && line.sellingPrice < 0) {
      return true;
    }

    if (line.discountPercent != null && line.discountPercent < 0) {
      return true;
    }

    const quantity = Math.max(1, line.quantity ?? 1);
    return line.sellingPrice != null && line.sellingPrice * quantity < 0;
  });

  const negativeLenses = record.lenses.some((line) => line.price != null && line.price < 0);

  return negativeFrames || negativeLenses;
}

export function shouldConfirmNegativePaymentValues(
  cartItems: CartLineItem[],
  totals: PaymentTotals,
  draft: PaymentDraft,
  prescriptionRecord: PrescriptionRecord | null,
): boolean {
  return (
    hasNegativeCartValues(cartItems) ||
    hasNegativePaymentDraftValues(draft, totals) ||
    (prescriptionRecord != null && hasNegativePrescriptionValues(prescriptionRecord))
  );
}

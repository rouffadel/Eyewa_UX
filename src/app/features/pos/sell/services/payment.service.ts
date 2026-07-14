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

  calculateTotals(subtotal: number, draft: PaymentDraft): PaymentTotals {
    const discount = Math.max(0, draft.discountAmount);
    const afterDiscount = Math.max(0, subtotal - discount);
    const vatRate = this.appConfig.settings?.vatRate ?? 0.15;
    const vat = afterDiscount * vatRate;
    const total = afterDiscount + vat;
    const loyaltyDeduction =
      draft.redeemLoyalty && draft.loyaltyPoints > 0
        ? Math.min(draft.loyaltyPoints, total)
        : 0;
    const payable = Math.max(0, total - loyaltyDeduction);

    return {
      subtotal,
      discount,
      vat,
      total,
      loyaltyDeduction,
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
  ): Pick<PaymentDraft, 'cashAmount' | 'cardAmount'> {
    if (draft.settleRemainingBalance) {
      const due = settlementAmountDue(payable, draft, orderPayment);
      return this.partialAmountsForMethod(method, due);
    }

    if (draft.payPartial) {
      return this.partialAmountsForMethod(method, draft.partialAmount);
    }

    const normalizedPayable = Math.max(0, payable);

    switch (method) {
      case 'cash':
        return { cashAmount: normalizedPayable, cardAmount: 0 };
      case 'card':
        return { cashAmount: 0, cardAmount: normalizedPayable };
      case 'mixed': {
        if (draft.method !== 'mixed') {
          const half = Math.round((normalizedPayable / 2) * 100) / 100;
          return {
            cashAmount: half,
            cardAmount: Math.max(0, normalizedPayable - half),
          };
        }

        return {
          cashAmount: Math.max(0, draft.cashAmount),
          cardAmount: Math.max(0, draft.cardAmount),
        };
      }
      default:
        return { cashAmount: 0, cardAmount: 0 };
    }
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

  isPaymentComplete(
    payable: number,
    draft: PaymentDraft,
    orderPayment?: SalesDetailsPaymentSummary | null,
  ): boolean {
    if (draft.method === 'more') {
      return false;
    }

    const normalizedPayable = Math.max(0, payable);

    if (normalizedPayable === 0 && !draft.settleRemainingBalance) {
      return false;
    }

    if (draft.settleRemainingBalance) {
      const due = settlementAmountDue(payable, draft, orderPayment);
      if (due <= 0) {
        return false;
      }

      return this.amountsEqual(mixedAmountPaid(draft), due);
    }

    if (draft.payPartial) {
      const partialAmount = Math.max(0, draft.partialAmount);
      return partialAmount > 0 && partialAmount < normalizedPayable;
    }

    switch (draft.method) {
      case 'cash':
        return this.amountsEqual(draft.cashAmount, normalizedPayable) && draft.cardAmount === 0;
      case 'card':
        return this.amountsEqual(draft.cardAmount, normalizedPayable) && draft.cashAmount === 0;
      case 'mixed':
        return (
          draft.cashAmount > 0 &&
          draft.cardAmount > 0 &&
          this.amountsEqual(draft.cashAmount + draft.cardAmount, normalizedPayable)
        );
      default:
        return false;
    }
  }

  paymentValidationMessage(
    payable: number,
    draft: PaymentDraft,
    orderPayment?: SalesDetailsPaymentSummary | null,
  ): string | null {
    if (draft.method === 'more') {
      return 'Select Cash, Card, or Mixed to continue.';
    }

    if (draft.settleRemainingBalance) {
      const due = settlementAmountDue(payable, draft, orderPayment);
      if (due <= 0) {
        return 'No remaining balance to pay.';
      }

      if (!this.isPaymentComplete(payable, draft, orderPayment)) {
        if (draft.method === 'mixed') {
          const balance = Math.max(0, due - mixedAmountPaid(draft));
          if (balance > AMOUNT_EPSILON) {
            return `Remaining balance: ${formatMoney(balance)} SAR. Cash and card must cover the amount due.`;
          }

          return 'Enter cash and card amounts that add up to the remaining balance.';
        }

        return 'Payment amount must match the remaining balance.';
      }

      return null;
    }

    if (draft.payPartial) {
      const partialAmount = Math.max(0, draft.partialAmount);
      const normalizedPayable = Math.max(0, payable);

      if (partialAmount <= 0) {
        return 'Enter the partial payment amount.';
      }

      if (partialAmount >= normalizedPayable) {
        return 'Partial payment must be less than the payable amount.';
      }

      return null;
    }

    if (!this.isPaymentComplete(payable, draft)) {
      if (draft.method === 'mixed') {
        const balance = mixedBalanceRemaining(payable, draft);
        if (balance > AMOUNT_EPSILON) {
          return `Remaining balance: ${formatMoney(balance)} SAR. Cash and card must cover the payable amount.`;
        }

        return 'Enter cash and card amounts that add up to the payable amount.';
      }

      return 'Payment amount must match the payable amount.';
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
    return Math.max(0, orderPayment.balance);
  }

  if (draft.payPartial) {
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
  if (paymentDraft?.payPartial && paymentDraft.partialAmount > 0) {
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
  if (draft.settleRemainingBalance && orderPayment) {
    return Math.max(0, orderPayment.netTotal);
  }

  if (draft.payPartial) {
    return Math.min(Math.max(0, payable), Math.max(0, draft.partialAmount));
  }

  switch (draft.method) {
    case 'cash':
      return Math.max(0, draft.cashAmount);
    case 'card':
      return Math.max(0, draft.cardAmount);
    case 'mixed':
      return mixedAmountPaid(draft);
    default:
      return Math.max(0, payable);
  }
}

export function paymentBalanceRemaining(
  payable: number,
  draft: PaymentDraft,
  orderPayment?: SalesDetailsPaymentSummary | null,
): number {
  if (draft.settleRemainingBalance) {
    return 0;
  }

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

import { Injectable } from '@angular/core';
import { AppConfigService } from '../../../../services/app-config.service';
import {
  DEFAULT_PAYMENT_DRAFT,
  PaymentDraft,
  PaymentMethod,
  PaymentTotals,
} from '../models/payment.models';
import { SalesDetailsPaymentSummary } from '../models/sales-details-grid.models';

const AMOUNT_EPSILON = 0.01;

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

  const netTotal = Math.max(0, orderPayment.netTotal);
  const balance = Math.max(0, orderPayment.balance);
  return Math.max(0, netTotal - balance);
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

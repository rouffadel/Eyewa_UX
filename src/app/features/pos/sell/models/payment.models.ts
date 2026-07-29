export type PaymentMethod = 'cash' | 'card' | 'mixed' | 'more';

export type PaymentRegisterAction =
  | 'daily-report'
  | 'cash-report'
  | 'open-register'
  | 'close-register';

export interface PaymentDraft {
  discountAmount: number;
  redeemLoyalty: boolean;
  loyaltyPoints: number;
  method: PaymentMethod;
  cashAmount: number;
  cardAmount: number;
  partialAmount: number;
  applyInsurance: boolean;
  /** Pay off the remaining balance on an existing partially-paid order. */
  settleRemainingBalance: boolean;
  deliveryDate: string | null;
}

export interface PaymentTotals {
  subtotal: number;
  discount: number;
  vat: number;
  total: number;
  loyaltyDeduction: number;
  insuranceAmount: number;
  insuranceCompensation: number;
  insuranceCompensationType: 'percentage' | 'amount' | null;
  payable: number;
}

export const DEFAULT_PAYMENT_DRAFT: PaymentDraft = {
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
};

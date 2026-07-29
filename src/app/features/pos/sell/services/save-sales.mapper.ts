import {
  calculateFrameLineTotals,
  PrescriptionFrameLine,
  PrescriptionRecord,
} from '../../prescription/models/prescription.models';
import { Customer } from '../models/customer.models';
import { PaymentDraft } from '../models/payment.models';
import {
  SaveSalesDetailsPayload,
  SaveSalesGridPayload,
} from '../models/save-sales.models';
import { SalesDetailsPaymentSummary } from '../models/sales-details-grid.models';
import { paymentAmountPaid, orderAmountAlreadyPaid } from './payment.service';

interface BuildSaveSalesPayloadOptions {
  customer: Customer;
  record: PrescriptionRecord;
  storeId: string;
  loginId: number;
  salesManId: number;
  payable: number;
  draft: PaymentDraft;
  orderPayment?: SalesDetailsPaymentSummary | null;
  /** Coverage amount already deducted from payable; empty string when none. */
  insuranceAmount?: number | null;
  deliveryDate?: string | null;
}

export function buildSaveSalesDetailsPayload({
  customer,
  record,
  storeId,
  loginId,
  salesManId,
  payable,
  draft,
  orderPayment = null,
  insuranceAmount = null,
  deliveryDate = null,
}: BuildSaveSalesPayloadOptions): SaveSalesDetailsPayload {
  const salesId = customer.salesId ?? record.salesId;

  if (salesId == null) {
    throw new Error('Create or select a sales customer before paying.');
  }

  const grids = record.frames
    .filter((line) => hasFrameForSales(line))
    .map((line) => toSalesGrid(line, salesId));

  if (grids.length === 0) {
    throw new Error('Select a product for each frame before paying.');
  }

  const grossTotal = roundMoney(
    record.frames.reduce((sum, line) => sum + (line.sellingPrice ?? 0) * Math.max(1, line.quantity ?? 1), 0),
  );
  const discount = roundMoney(grids.reduce((sum, line) => sum + line.Discount, 0));
  const netTotal = roundMoney(grids.reduce((sum, line) => sum + Number(line.SellingPrice), 0));
  const paymentAmounts = resolveSaveSalesPaymentAmounts(netTotal, draft, orderPayment, payable);
  const resolvedInsuranceAmount =
    insuranceAmount != null && Number.isFinite(insuranceAmount) && insuranceAmount > 0
      ? formatAmount(insuranceAmount)
      : '0';

  const basePayload = {
    SalesId: salesId,
    LoginId: loginId,
    StoreId: storeId,
    SalesGrids: grids,
    GrossTotal: grossTotal,
    Discount: discount,
    Tax: '0',
    NetTotal: formatAmount(netTotal),
    Balance: formatAmount(paymentAmounts.balance),
    CustomerName: customer.displayName,
    CustomerNo: customer.phone ?? customer.phoneMasked,
    SalesManId: salesManId,
    RedeemedLoyaltyPoints: draft.redeemLoyalty && draft.loyaltyPoints > 0 ? Math.min(draft.loyaltyPoints, netTotal) : 0,
    ...(deliveryDate ? { DeliveryDate: deliveryDate } : {}),
  };

  if (draft.method === 'mixed') {
    const payments = [];
    if (draft.cashAmount > 0) {
      payments.push({
        PaidAmount: draft.cashAmount,
        AdvancePaidAmount: draft.cashAmount,
        InsuranceAmount: resolvedInsuranceAmount,
        PaymentMode: 'Cash',
      });
    }
    if (draft.cardAmount > 0) {
      payments.push({
        PaidAmount: draft.cardAmount,
        AdvancePaidAmount: draft.cardAmount,
        InsuranceAmount: resolvedInsuranceAmount,
        PaymentMode: 'Card',
      });
    }

    return { ...basePayload, payments };
  }

  return {
    ...basePayload,
    PaidAmount: paymentAmounts.paidAmount,
    AdvancePaidAmount: paymentAmounts.advancePaidAmount,
    PaymentMode: paymentModeLabel(draft),
    InsuranceAmount: resolvedInsuranceAmount,
  };
}

function resolveSaveSalesPaymentAmounts(
  netTotal: number,
  draft: PaymentDraft,
  orderPayment: SalesDetailsPaymentSummary | null,
  payable: number,
): { paidAmount: number; advancePaidAmount: number; balance: number } {
  const roundedNetTotal = roundMoney(netTotal);

  if (draft.settleRemainingBalance && orderPayment) {
    const alreadyPaid = orderAmountAlreadyPaid(orderPayment);
    const remainingBalance = roundMoney(Math.max(0, payable - alreadyPaid));
    return {
      paidAmount: remainingBalance,
      advancePaidAmount: remainingBalance,
      balance: 0,
    };
  }

  const alreadyPaid = orderPayment ? orderAmountAlreadyPaid(orderPayment) : 0;
  const paidAmount = roundMoney(
    paymentAmountPaid(payable, draft, orderPayment),
  );

  return {
    paidAmount,
    advancePaidAmount: paidAmount,
    balance: roundMoney(Math.max(0, payable - alreadyPaid - paidAmount)),
  };
}

function toSalesGrid(line: PrescriptionFrameLine, salesId: number): SaveSalesGridPayload {
  const quantity = Math.max(1, line.quantity ?? 1);
  const productValue = roundMoney(line.sellingPrice ?? 0);
  const totals = calculateFrameLineTotals(productValue, quantity, line.discountPercent);

  return {
    SalesDetailId: line.salesDetailsId ?? salesId,
    CategoryId: line.categoryId!,
    BrandId: line.brandId!,
    ProductId: line.productId!,
    ProductValue: productValue,
    Quantity: String(quantity),
    Discount: roundMoney(totals.discountAmount),
    SellingPrice: formatAmount(totals.totalSellingPrice),
    Tax: 0,
    TaxPer: 0,
  };
}

function hasFrameForSales(line: PrescriptionFrameLine): boolean {
  return (
    line.categoryId != null &&
    line.brandId != null &&
    line.productId != null &&
    line.sellingPrice != null
  );
}

export function hasPrescriptionFramesForSales(record: PrescriptionRecord): boolean {
  return record.frames.some((line) => hasFrameForSales(line));
}

export function computePrescriptionFrameNetTotal(record: PrescriptionRecord): number {
  return roundMoney(
    record.frames
      .filter((line) => hasFrameForSales(line))
      .reduce((sum, line) => {
        const totals = calculateFrameLineTotals(
          line.sellingPrice,
          line.quantity,
          line.discountPercent,
        );
        return sum + totals.totalSellingPrice;
      }, 0),
  );
}

function paymentModeLabel(draft: PaymentDraft): string {
  if (draft.method === 'card') {
    return 'Card';
  }

  if (draft.method === 'mixed') {
    return 'Mixed';
  }

  return 'Cash';
}

function roundMoney(value: number): number {
  return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
}

function formatAmount(value: number): string {
  return roundMoney(value).toFixed(2);
}

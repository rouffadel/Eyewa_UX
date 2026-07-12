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
import { paymentAmountPaid } from './payment.service';
import { SalesDetailsPaymentSummary } from '../models/sales-details-grid.models';

interface BuildSaveSalesPayloadOptions {
  customer: Customer;
  record: PrescriptionRecord;
  storeId: string;
  salesManId: number;
  payable: number;
  draft: PaymentDraft;
  orderPayment?: SalesDetailsPaymentSummary | null;
}

export function buildSaveSalesDetailsPayload({
  customer,
  record,
  storeId,
  salesManId,
  payable,
  draft,
  orderPayment = null,
}: BuildSaveSalesPayloadOptions): SaveSalesDetailsPayload {
  const salesId = customer.salesId ?? record.salesId;

  if (salesId == null) {
    throw new Error('Create or select a sales customer before paying.');
  }

  const grids = record.frames
    .filter((line) => hasFrameForSales(line))
    .map((line) => toSalesGrid(line, salesId));

  if (grids.length === 0) {
    throw new Error('Save a prescription frame before paying.');
  }

  const grossTotal = roundMoney(
    record.frames.reduce((sum, line) => sum + (line.sellingPrice ?? 0) * Math.max(1, line.quantity ?? 1), 0),
  );
  const discount = roundMoney(grids.reduce((sum, line) => sum + line.Discount, 0));
  const netTotal = roundMoney(grids.reduce((sum, line) => sum + Number(line.SellingPrice), 0));
  const paidAmount = roundMoney(paymentAmountPaid(payable, draft, orderPayment));
  const balance = roundMoney(Math.max(0, netTotal - paidAmount));

  return {
    SalesId: salesId,
    StoreId: storeId,
    SalesGrids: grids,
    GrossTotal: grossTotal,
    Discount: discount,
    Tax: '0',
    NetTotal: formatAmount(netTotal),
    Balance: formatAmount(balance),
    PaidAmount: paidAmount,
    AdvancePaidAmount: 0,
    PaymentMode: paymentModeLabel(draft),
    CustomerName: customer.displayName,
    CustomerNo: customer.phone ?? customer.phoneMasked,
    SalesManId: salesManId,
  };
}

function toSalesGrid(line: PrescriptionFrameLine, salesId: number): SaveSalesGridPayload {
  const quantity = Math.max(1, line.quantity ?? 1);
  const productValue = roundMoney(line.sellingPrice ?? 0);
  const totals = calculateFrameLineTotals(productValue, quantity, line.discountPercent);

  return {
    SalesDetailId: salesId,
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

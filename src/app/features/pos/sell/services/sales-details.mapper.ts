import { CartLineItem } from '../models/cart.models';
import { PaymentDraft } from '../models/payment.models';
import { Product } from '../models/product.models';
import {
  SalesDetailsGridLineItem,
  SalesDetailsPaymentSummary,
} from '../models/sales-details-grid.models';

export function cartItemsFromSalesDetails(lines: SalesDetailsGridLineItem[]): CartLineItem[] {
  return lines.map((line) => toCartItem(line));
}

export function paymentDraftFromSalesDetails(
  payment: SalesDetailsPaymentSummary,
): Partial<PaymentDraft> {
  const draft: Partial<PaymentDraft> = {
    discountAmount: Math.max(0, payment.discount),
    settleRemainingBalance: true,
    partialAmount: 0,
  };

  if (payment.insuranceAmount > 0) {
    draft.applyInsurance = true;
  }

  return draft;
}

function toCartItem(line: SalesDetailsGridLineItem): CartLineItem {
  const discountAmount = calculateLineDiscount(line);
  const product: Product = {
    sku: `sales-product-${line.productId}`,
    name: formatLineName(line),
    price: line.productValue,
    category: 'frames',
    description: line.categoryName,
  };

  return {
    lineId: `sales-${line.salesDetailsId}`,
    product,
    qty: line.quantity,
    unitPrice: line.productValue,
    discount: discountAmount,
    variantLabel: line.categoryName,
  };
}

function formatLineName(line: SalesDetailsGridLineItem): string {
  const brand = line.brandName.trim();
  const product = line.productName.trim();

  if (brand && product) {
    return `${brand} ${product}`;
  }

  return brand || product || 'Sale item';
}

function calculateLineDiscount(line: SalesDetailsGridLineItem): number {
  const subtotal = line.productValue * line.quantity;
  const percent = Math.max(0, line.discountPercent);

  return subtotal * (percent / 100);
}

export function isSalesCartLine(lineId: string): boolean {
  return lineId.startsWith('sales-');
}

/** True when an existing sale has received payment and the cart must stay read-only. */
export function isOrderCartLocked(payment: SalesDetailsPaymentSummary | null): boolean {
  if (!payment) {
    return false;
  }

  const netTotal = Math.max(0, payment.netTotal);
  const balance = Math.max(0, payment.balance);

  if (netTotal <= 0) {
    return false;
  }

  return balance < netTotal;
}

/** True when an existing sale has no remaining balance to collect. */
export function isOrderFullyPaid(payment: SalesDetailsPaymentSummary | null): boolean {
  if (!payment) {
    return false;
  }

  const netTotal = Math.max(0, payment.netTotal);
  const balance = Math.max(0, payment.balance);

  return netTotal > 0 && balance <= 0.01;
}

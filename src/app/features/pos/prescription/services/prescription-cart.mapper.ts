import { CartLineItem } from '../../sell/models/cart.models';
import { CatalogCategory, Product } from '../../sell/models/product.models';
import {
  calculateFrameLineTotals,
  calculateLensLineTotal,
  PrescriptionFrameLine,
  PrescriptionLensLine,
  PrescriptionRecord,
} from '../models/prescription.models';

export function prescriptionLinesToCartItems(record: PrescriptionRecord): CartLineItem[] {
  const frameItems = record.frames
    .filter((line) => hasFrameLineData(line))
    .map((line, index) => toFrameCartItem(line, index));

  const lensItems = record.lenses.map((line, index) => toLensCartItem(line, index));

  return [...frameItems, ...lensItems];
}

export function isPrescriptionCartLine(lineId: string): boolean {
  return lineId.startsWith('rx-frame-') || lineId.startsWith('rx-lens-');
}

export function applyCartItemsToPrescriptionRecord(
  record: PrescriptionRecord,
  cartItems: CartLineItem[],
): PrescriptionRecord {
  const frameCartItems = cartItems
    .filter((item) => item.lineId.startsWith('rx-frame-'))
    .sort((left, right) => extractPrescriptionLineIndex(left.lineId, 'frame') - extractPrescriptionLineIndex(right.lineId, 'frame'));

  const lensCartItems = cartItems
    .filter((item) => item.lineId.startsWith('rx-lens-'))
    .sort((left, right) => extractPrescriptionLineIndex(left.lineId, 'lens') - extractPrescriptionLineIndex(right.lineId, 'lens'));

  const frames = frameCartItems.map((item) => {
    const index = extractPrescriptionLineIndex(item.lineId, 'frame');
    const existing = record.frames[index];
    return cartItemToFrameLine(item, existing);
  });

  const lenses = lensCartItems.map((item) => {
    const index = extractPrescriptionLineIndex(item.lineId, 'lens');
    const existing = record.lenses[index];
    return cartItemToLensLine(item, existing);
  });

  return {
    ...record,
    frames,
    lenses,
    orderLensEnabled: lenses.length > 0,
    updatedAt: new Date().toISOString(),
  };
}

function extractPrescriptionLineIndex(lineId: string, kind: 'frame' | 'lens'): number {
  const prefix = kind === 'frame' ? 'rx-frame-' : 'rx-lens-';
  const match = lineId.match(new RegExp(`^${prefix}(\\d+)-`));
  return match ? Number(match[1]) : 0;
}

function cartItemToFrameLine(
  item: CartLineItem,
  existing?: PrescriptionFrameLine,
): PrescriptionFrameLine {
  const quantity = Math.max(1, item.qty);
  const sellingPrice = item.unitPrice;
  const subtotal = sellingPrice * quantity;
  const discountPercent =
    subtotal > 0
      ? Math.round((item.discount / subtotal) * 10000) / 100
      : (existing?.discountPercent ?? 0);

  return {
    category: existing?.category ?? item.variantLabel ?? '',
    categoryId: existing?.categoryId ?? null,
    brandId: existing?.brandId ?? null,
    brandName: existing?.brandName ?? item.product.name,
    productId: existing?.productId ?? null,
    modelNo: existing?.modelNo ?? '',
    sellingPrice,
    quantity,
    maxDiscount: existing?.maxDiscount ?? null,
    discountPercent,
  };
}

function cartItemToLensLine(
  item: CartLineItem,
  existing?: PrescriptionLensLine,
): PrescriptionLensLine {
  return {
    orderLenseId: existing?.orderLenseId ?? null,
    category: existing?.category ?? item.variantLabel ?? '',
    orderLens: existing?.orderLens ?? item.product.name,
    price: item.unitPrice,
    quantity: Math.max(1, item.qty),
    originalQuantity: existing?.originalQuantity,
  };
}

function toFrameCartItem(line: PrescriptionFrameLine, index: number): CartLineItem {
  const totals = calculateFrameLineTotals(line.sellingPrice, line.quantity, line.discountPercent);
  const product: Product = {
    sku: `rx-frame-${index}`,
    name: formatFrameName(line),
    price: line.sellingPrice ?? 0,
    category: 'frames',
    productId: line.productId ?? undefined,
  };

  return {
    lineId: `rx-frame-${index}-${product.sku}`,
    product,
    qty: Math.max(1, line.quantity ?? 1),
    unitPrice: line.sellingPrice ?? 0,
    discount: totals.discountAmount,
    variantLabel: line.category,
  };
}

function toLensCartItem(line: PrescriptionLensLine, index: number): CartLineItem {
  const unitPrice = line.price ?? 0;
  const product: Product = {
    sku: `rx-lens-${index}`,
    name: formatLensName(line),
    price: unitPrice,
    category: 'lenses' as CatalogCategory,
  };

  return {
    lineId: `rx-lens-${index}-${product.sku}`,
    product,
    qty: Math.max(1, line.quantity ?? 1),
    unitPrice,
    discount: 0,
    variantLabel: line.category,
  };
}

function formatFrameName(line: PrescriptionFrameLine): string {
  const brand = line.brandName.trim();
  const model = line.modelNo.trim();
  return [brand, model].filter(Boolean).join(' ');
}

function formatLensName(line: PrescriptionLensLine): string {
  return `${line.category} — ${line.orderLens.trim()}`;
}

function hasFrameLineData(line: PrescriptionFrameLine): boolean {
  return (
    Boolean(line.brandName?.trim()) ||
    Boolean(line.modelNo?.trim()) ||
    line.sellingPrice != null ||
    line.discountPercent != null
  );
}

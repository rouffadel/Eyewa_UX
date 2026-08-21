import {
  calculateFrameLineTotals,
  PrescriptionFrameLine,
  PrescriptionLensLine,
  PrescriptionRecord,
} from '../../prescription/models/prescription.models';
import { CartLineItem } from '../models/cart.models';
import { Product } from '../models/product.models';

function isBillableFrameLine(line: PrescriptionFrameLine): boolean {
  return Boolean(
    line.brandName.trim() || line.modelNo.trim() || line.sellingPrice !== null,
  );
}

function isBillableLensLine(line: PrescriptionLensLine): boolean {
  return Boolean(line.orderLens.trim() || line.price !== null);
}

function frameDisplayName(line: PrescriptionFrameLine): string {
  const brand = line.brandName.trim();
  const model = line.modelNo.trim();

  if (brand && model) {
    return `${brand} ${model}`;
  }

  return brand || model || 'Prescription frame';
}

function lensDisplayName(line: PrescriptionLensLine): string {
  return line.orderLens.trim() || 'Prescription lens';
}

function frameVariantLabel(line: PrescriptionFrameLine): string {
  const parts = [line.category, line.modelNo.trim()].filter(Boolean);
  return parts.join(' | ');
}

export function cartItemsFromPrescription(record: PrescriptionRecord): CartLineItem[] {
  const items: CartLineItem[] = [];

  record.frames.filter(isBillableFrameLine).forEach((line, index) => {
    const totals = calculateFrameLineTotals(
      line.sellingPrice,
      line.quantity,
      line.discountPercent,
    );
    const product: Product = {
      sku: `rx-frame-${record.id}-${index}`,
      name: frameDisplayName(line),
      price: line.sellingPrice ?? 0,
      category: 'frames',
      description: line.category,
      productId: line.productId ?? undefined,
    };

    items.push({
      lineId: `rx-${record.id}-frame-${index}`,
      product,
      qty: Math.max(1, line.quantity),
      unitPrice: line.sellingPrice ?? 0,
      discount: totals.discountAmount,
      variantLabel: frameVariantLabel(line),
    });
  });

  if (record.orderLensEnabled) {
    record.lenses.filter(isBillableLensLine).forEach((line, index) => {
      const product: Product = {
        sku: `rx-lens-${record.id}-${index}`,
        name: lensDisplayName(line),
        price: line.price ?? 0,
        category: 'lenses',
        description: line.category,
      };

      items.push({
        lineId: `rx-${record.id}-lens-${index}`,
        product,
        qty: Math.max(1, line.quantity),
        unitPrice: line.price ?? 0,
        discount: 0,
        variantLabel: line.category,
      });
    });
  }

  return items;
}

export function isPrescriptionCartLine(item: CartLineItem): boolean {
  return item.lineId.startsWith('rx-');
}

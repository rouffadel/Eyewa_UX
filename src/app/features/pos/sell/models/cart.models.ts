import { Product } from './product.models';

export interface CartLineItem {
  lineId: string;
  product: Product;
  qty: number;
  unitPrice: number;
  discount: number;
  variantLabel?: string;
}

export function lineTotal(item: CartLineItem): number {
  return item.qty * item.unitPrice - item.discount;
}

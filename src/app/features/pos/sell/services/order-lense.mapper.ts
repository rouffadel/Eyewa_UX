import { CartLineItem } from '../models/cart.models';
import { OrderLenseLine } from '../models/order-lense.models';
import { Product } from '../models/product.models';

export function cartItemsFromOrderLense(lenses: OrderLenseLine[]): CartLineItem[] {
  return lenses
    .filter((line) => line.isActive && !line.isDeleted)
    .map((line) => toCartItem(line));
}

export function isOrderLenseCartLine(lineId: string): boolean {
  return lineId.startsWith('order-lens-');
}

function toCartItem(line: OrderLenseLine): CartLineItem {
  const product: Product = {
    sku: `order-lens-${line.orderLenseId}`,
    name: formatLensName(line),
    price: line.price,
    category: 'lenses',
    description: line.category,
  };

  return {
    lineId: `order-lens-${line.orderLenseId}`,
    product,
    qty: line.quantity,
    unitPrice: line.price,
    discount: 0,
    variantLabel: line.category,
  };
}

function formatLensName(line: OrderLenseLine): string {
  const order = line.orderLense.trim();

  if (order) {
    return order;
  }

  return line.category.trim() || 'Order lens';
}

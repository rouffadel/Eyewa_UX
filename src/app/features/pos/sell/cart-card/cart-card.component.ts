import { Component, input, output } from '@angular/core';
import { CartLineItem, lineTotal } from '../models/cart.models';
import { formatMoney } from '../services/payment.service';

@Component({
  selector: 'app-cart-card',
  templateUrl: './cart-card.component.html',
  styleUrl: './cart-card.component.css',
  host: { class: 'cart-card-host' },
})
export class CartCardComponent {
  readonly items = input<CartLineItem[]>([]);
  readonly locked = input(false);

  readonly qtyChange = output<{ lineId: string; qty: number }>();
  readonly removeItem = output<string>();
  readonly clearCart = output<void>();

  protected formatMoney = formatMoney;
  protected lineTotal = lineTotal;

  protected itemCount(): number {
    return this.items().reduce((sum, item) => sum + item.qty, 0);
  }

  protected itemLabel(item: CartLineItem): string {
    const variant = item.variantLabel ? `, ${item.variantLabel}` : '';
    return `${item.product.name}${variant}`;
  }
}

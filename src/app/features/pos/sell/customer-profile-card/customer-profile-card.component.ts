import { Component, input, output } from '@angular/core';
import { Customer } from '../models/customer.models';

@Component({
  selector: 'app-customer-profile-card',
  templateUrl: './customer-profile-card.component.html',
  styleUrl: './customer-profile-card.component.css',
  host: { class: 'customer-profile-card-host' },
})
export class CustomerProfileCardComponent {
  /** Flip to true when loyalty redemption is enabled (Phase 3). */
  showLoyaltySection = true;

  readonly customer = input<Customer | null>(null);
  readonly refreshing = input(false);
  readonly hasRedmeePointsAccess = input(true);

  readonly redeemPoints = output<void>();
  readonly openDetail = output<void>();
  readonly refresh = output<void>();

  protected onRefreshClick(event: Event): void {
    event.stopPropagation();
    event.preventDefault();

    if (this.refreshing()) {
      return;
    }

    this.refresh.emit();
  }
}

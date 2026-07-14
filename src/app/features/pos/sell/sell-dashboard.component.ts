import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { CustomerProfileCardComponent } from './customer-profile-card/customer-profile-card.component';
import { LatestPrescriptionSummaryComponent } from './latest-prescription-summary/latest-prescription-summary.component';
import { ProductCatalogCardComponent } from './product-catalog-card/product-catalog-card.component';
import { CartCardComponent } from './cart-card/cart-card.component';
import { PaymentCardComponent } from './payment-card/payment-card.component';
import { CatalogCategory } from './models/product.models';
import { PaymentMethod } from './models/payment.models';
import { Product } from './models/product.models';
import { SellSessionStore } from './services/sell-session.store';

@Component({
  selector: 'app-sell-dashboard',
  imports: [
    CustomerProfileCardComponent,
    LatestPrescriptionSummaryComponent,
    ProductCatalogCardComponent,
    CartCardComponent,
    PaymentCardComponent,
  ],
  templateUrl: './sell-dashboard.component.html',
  styleUrl: './sell-dashboard.component.css',
})
export class SellDashboardComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  protected readonly store = inject(SellSessionStore);

  protected onCategoryChange(category: CatalogCategory): void {
    this.store.setCatalogCategory(category);
  }

  protected onCatalogSearch(search: string): void {
    this.store.setCatalogSearch(search);
  }

  protected onProductSelect(product: Product): void {
    this.store.addProductToCart(product);
  }

  protected onQtyChange(event: { lineId: string; qty: number }): void {
    this.store.updateQty(event.lineId, event.qty);
  }

  protected onRemoveItem(lineId: string): void {
    this.store.removeItem(lineId);
  }

  protected onClearCart(): void {
    if (window.confirm('Clear all items from the cart?')) {
      this.store.clearCart();
    }
  }

  protected onDiscountChange(amount: number): void {
    this.store.updatePaymentDraft({ discountAmount: amount });
  }

  protected onLoyaltyToggle(enabled: boolean): void {
    this.store.setLoyaltyRedemption(enabled);
  }

  protected onMethodChange(method: PaymentMethod): void {
    this.store.setPaymentMethod(method);
    this.store.clearStatusMessages();
  }

  protected onCashAmountChange(amount: number): void {
    this.store.setMixedCashAmount(amount);
    this.store.clearStatusMessages();
  }

  protected onCardAmountChange(amount: number): void {
    this.store.setMixedCardAmount(amount);
    this.store.clearStatusMessages();
  }

  protected onPartialToggle(enabled: boolean): void {
    this.store.setPartialPayment(enabled);
    this.store.clearStatusMessages();
  }

  protected onPayFullToggle(enabled: boolean): void {
    this.store.setPayFull(enabled);
    this.store.clearStatusMessages();
  }

  protected onPartialAmountChange(amount: number): void {
    this.store.setPartialPaymentAmount(amount);
    this.store.clearStatusMessages();
  }

  protected onPay(): void {
    const staffName = this.auth.currentSession()?.displayName ?? '—';
    void this.store.pay(staffName);
  }

  protected onPrintReceipt(): void {
    const staffName = this.auth.currentSession()?.displayName ?? '—';

    if (this.store.printReceipt(staffName)) {
      void this.router.navigate(['/home/sell/invoice']);
    }
  }

  protected onNewPrescription(): void {
    void this.router.navigate(['/home/prescription']);
  }

  protected onViewPrescription(): void {
    void this.router.navigate(['/home/prescription']);
  }

  protected onViewHistory(): void {
    void this.router.navigate(['/home/prescription/history']);
  }

  protected onRedeemPoints(): void {
    this.store.redeemPointsStub();
  }

  protected onOpenCustomerDetail(): void {
    this.store.statusMessage.set('Customer detail view is not connected yet.');
  }

  protected onScan(): void {
    void this.store.scanProductBarcode();
  }

  protected onFilter(): void {
    this.store.statusMessage.set('Product filters are not connected yet.');
  }

  protected onDismissStatus(): void {
    this.store.clearStatusMessages();
  }
}

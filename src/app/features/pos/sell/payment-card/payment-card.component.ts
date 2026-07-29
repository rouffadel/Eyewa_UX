import { Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PaymentDraft, PaymentMethod, PaymentTotals } from '../models/payment.models';
import {
  formatMoney,
  mixedBalanceRemaining,
  parsePaymentAmount,
  paymentAmountPaid,
  paymentBalanceRemaining,
} from '../services/payment.service';

@Component({
  selector: 'app-payment-card',
  imports: [FormsModule],
  templateUrl: './payment-card.component.html',
  styleUrl: './payment-card.component.css',
  host: { class: 'payment-card-host' },
})
export class PaymentCardComponent {
  readonly totals = input.required<PaymentTotals>();
  readonly draft = input.required<PaymentDraft>();
  readonly canPay = input(false);
  readonly canPrintReceipt = input(false);
  readonly orderFullyPaid = input(false);
  readonly isPaying = input(false);
  readonly settleFullRemaining = input(false);
  readonly outstandingBalance = input(0);
  readonly amountAlreadyPaid = input(0);
  readonly insuranceCompanyName = input<string | null>(null);
  readonly hasSalesInsurance = input(false);
  readonly isInsuranceLocked = input(false);

  readonly discountChange = output<number>();
  readonly loyaltyToggle = output<boolean>();
  readonly insuranceToggle = output<boolean>();
  readonly methodChange = output<PaymentMethod>();
  readonly cashAmountChange = output<number>();
  readonly cardAmountChange = output<number>();
  readonly partialAmountChange = output<number>();
  readonly deliveryDateChange = output<string | null>();
  readonly pay = output<void>();
  readonly payAndPrint = output<void>();
  readonly printReceipt = output<void>();

  protected formatMoney = formatMoney;

  protected readonly methods: { key: PaymentMethod; label: string }[] = [
    { key: 'cash', label: 'Cash' },
    { key: 'card', label: 'Card' },
    { key: 'mixed', label: 'Mixed' },
    { key: 'more', label: '…' },
  ];

  protected readonly mixedTotal = computed(
    () => this.draft().cashAmount + this.draft().cardAmount,
  );

  protected readonly mixedIsBalanced = computed(() => {
    const target = this.amountDue();
    return Math.abs(this.mixedTotal() - target) <= 0.01;
  });

  protected readonly mixedBalanceRemaining = computed(() =>
    mixedBalanceRemaining(this.amountDue(), this.draft()),
  );

  protected readonly paidAmount = computed(() =>
    paymentAmountPaid(this.amountDue(), this.draft()),
  );

  protected readonly balanceAmount = computed(() =>
    paymentBalanceRemaining(this.amountDue(), this.draft()),
  );

  protected readonly showSettlementSummary = computed(
    () => this.draft().settleRemainingBalance && this.outstandingBalance() > 0.01,
  );

  protected readonly amountDue = computed(() => {
    if (this.amountAlreadyPaid() > 0) {
      return this.outstandingBalance();
    }
    return this.totals().payable;
  });

  protected readonly payButtonLabel = computed(() =>
    this.showSettlementSummary() ? 'PAY FULL' : 'PAY',
  );

  protected onDiscountInput(value: string | number): void {
    this.discountChange.emit(parsePaymentAmount(value));
  }

  protected onCashAmountInput(value: string | number): void {
    this.cashAmountChange.emit(parsePaymentAmount(value));
  }

  protected onCardAmountInput(value: string | number): void {
    this.cardAmountChange.emit(parsePaymentAmount(value));
  }

  protected onPartialAmountInput(value: string | number): void {
    this.partialAmountChange.emit(parsePaymentAmount(value));
  }
}

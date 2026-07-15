import { Component, computed, HostListener, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { PaymentRegisterAction } from '../sell/models/payment.models';
import { SellSessionStore } from '../sell/services/sell-session.store';

interface ReportAction {
  key: PaymentRegisterAction | 'pay-and-print';
  label: string;
  primary?: boolean;
}

@Component({
  selector: 'app-reports-page',
  templateUrl: './reports-page.component.html',
  styleUrl: './reports-page.component.css',
})
export class ReportsPageComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  protected readonly store = inject(SellSessionStore);

  protected readonly actions: ReportAction[] = [
   // { key: 'pay-and-print', label: 'PAY & PRINT', primary: true },
    { key: 'daily-report', label: 'Daily report' },
    { key: 'cash-report', label: 'Cash report' },
    { key: 'open-register', label: 'Open register' },
    { key: 'close-register', label: 'Close register' },
  ];

  protected readonly payAndPrintLabel = computed(() =>
    this.store.isSettlingRemainingBalance() ? 'PAY FULL & PRINT' : 'PAY & PRINT',
  );

  @HostListener('document:keydown', ['$event'])
  protected onDocumentKeydown(event: KeyboardEvent): void {
    if (event.key !== 'F9' || event.defaultPrevented) {
      return;
    }

    const target = event.target;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement
    ) {
      return;
    }

    event.preventDefault();
    this.onPayAndPrint();
  }

  protected actionLabel(action: ReportAction): string {
    return action.key === 'pay-and-print' ? this.payAndPrintLabel() : action.label;
  }

  protected isActionDisabled(action: ReportAction): boolean {
    if (action.key === 'pay-and-print') {
      return !this.store.canPay() || this.store.isPaying() || this.store.orderFullyPaid();
    }

    return false;
  }

  protected onAction(action: ReportAction): void {
    if (action.key === 'pay-and-print') {
      this.onPayAndPrint();
      return;
    }

    this.store.runPaymentRegisterAction(action.key);
  }

  protected onDismissStatus(): void {
    this.store.clearStatusMessages();
  }

  private onPayAndPrint(): void {
    if (this.isActionDisabled({ key: 'pay-and-print', label: '' })) {
      return;
    }

    const staffName = this.auth.currentSession()?.displayName ?? '—';

    void this.store.payAndPrint(staffName).then((paid) => {
      if (paid) {
        void this.router.navigate(['/home/sell/invoice']);
      }
    });
  }
}

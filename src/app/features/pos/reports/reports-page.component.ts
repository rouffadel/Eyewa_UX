import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { PaymentRegisterAction } from '../sell/models/payment.models';
import { SellSessionStore } from '../sell/services/sell-session.store';
import { FramesSalesReportRow } from './models/reports.models';
import { ReportsService } from './services/reports.service';

interface ReportAction {
  key: PaymentRegisterAction | 'pay-and-print';
  label: string;
  primary?: boolean;
}

@Component({
  selector: 'app-reports-page',
  imports: [DatePipe, DecimalPipe],
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

  protected reportData = signal<FramesSalesReportRow[]>([]);
  protected extraData = signal<any>(null);
  protected isLoading = signal(false);
  protected errorMessage = signal<string | null>(null);

  protected readonly fromDate = signal<string>(new Date().toISOString().split('T')[0]);
  protected readonly toDate = signal<string>(new Date().toISOString().split('T')[0]);

  private readonly reportsService = inject(ReportsService);

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

  protected onFromDateChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.fromDate.set(value);
  }

  protected onToDateChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.toDate.set(value);
  }

  protected async loadFramesSalesReport(): Promise<void> {
    const storeId = this.auth.selectedStore()?.storeId;
    if (!storeId) {
      this.errorMessage.set('Store ID is not available. Please select a store first.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const data = await this.reportsService.getFramesSalesReport(
        this.fromDate(),
        this.toDate(),
        storeId,
      );
      this.reportData.set(data.objresult ?? []);
      if (data.extraData) {
        this.extraData.set({
          TotalAmount: data.extraData.TotalAmount ?? (data.extraData as any).totalAmount ?? 0,
          TotalCash: data.extraData.TotalCash ?? (data.extraData as any).totalCash ?? 0,
          TotalCard: data.extraData.TotalCard ?? (data.extraData as any).totalCard ?? 0,
          TotalInsurance: data.extraData.TotalInsurance ?? (data.extraData as any).totalInsurance ?? 0,
          TotalNetTotal: data.extraData.TotalNetTotal ?? (data.extraData as any).totalNetTotal ?? 0,
          TotalBalance: data.extraData.TotalBalance ?? (data.extraData as any).totalBalance ?? 0,
        });
      } else {
        this.extraData.set(null);
      }
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      this.isLoading.set(false);
    }
  }

  protected clearFramesSalesReport(): void {
    const today = new Date().toISOString().split('T')[0];
    this.fromDate.set(today);
    this.toDate.set(today);
    this.reportData.set([]);
    this.extraData.set(null);
    this.errorMessage.set(null);
  }

  protected exportToExcel(): void {
    const data = this.reportData();
    if (!data || data.length === 0) return;

    // CSV Headers
    let csv = 'Sale ID,Store,Customer Name,Customer No,Invoice Payment ID,Date,Amount,Mode,Insurance,Net Total,Balance,Products\n';

    // Rows
    data.forEach(row => {
      const products = `"${(row.Products || '').replace(/"/g, '""')}"`;
      const custName = `"${(row.CustomerName || '').replace(/"/g, '""')}"`;
      const date = row.PaymentDate ? new Date(row.PaymentDate).toLocaleString() : '';
      
      csv += `${row.SaleID},${row.StoreName},${custName},${row.CustomerNo},${row.InvoicePaymentID},"${date}",${row.PaymentAmount},${row.PaymentMode},${row.InsuranceAmount},${row.NetTotal},${row.Balance},${products}\n`;
    });

    csv += '\n';

    // Totals
    const extra = this.extraData();
    if (extra) {
      csv += `Total Cash,${extra.TotalCash || 0}\n`;
      csv += `Total Card,${extra.TotalCard || 0}\n`;
      csv += `Total Payment,${extra.TotalAmount || 0}\n`;
    }

    // Download Blob
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `SalesReport_${this.fromDate()}_to_${this.toDate()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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


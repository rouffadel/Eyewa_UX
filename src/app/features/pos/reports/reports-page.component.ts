import { Component, computed, HostListener, inject, OnInit, signal, effect, untracked } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { PaymentRegisterAction } from '../sell/models/payment.models';
import { SellSessionStore } from '../sell/services/sell-session.store';
import { FramesSalesReportRow } from './models/reports.models';
import { ReportsService } from './services/reports.service';
import { OrderStatusCategory } from '../shared/order-status.utils';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

interface ReportAction {
  key: PaymentRegisterAction | 'pay-and-print';
  label: string;
  primary?: boolean;
}

@Component({
  selector: 'app-reports-page',
  imports: [DatePipe, DecimalPipe, TranslatePipe],
  templateUrl: './reports-page.component.html',
  styleUrl: './reports-page.component.css',
})
export class ReportsPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly auth = inject(AuthService);
  protected readonly store = inject(SellSessionStore);
  private readonly reportsService = inject(ReportsService);

  protected readonly actions: ReportAction[] = [
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

  // Selected order status filter ('all' | 'completed' | 'pending' | 'incomplete')
  protected readonly selectedStatusFilter = signal<OrderStatusCategory>('all');

  // Filtered rows matching selectedStatusFilter
  protected readonly filteredReportData = computed<FramesSalesReportRow[]>(() => {
    const list = this.reportData();
    const filter = this.selectedStatusFilter();
    if (filter === 'all') {
      return list;
    }
    return list.filter((row) => this.matchReportStatus(row, filter));
  });

  // Dynamically calculated summary amounts based on filtered rows
  protected readonly filteredExtraData = computed(() => {
    const list = this.filteredReportData();

    let totalCash = 0;
    let totalCard = 0;
    let totalAmount = 0;
    let totalNetTotal = 0;
    let totalBalance = 0;
    let totalInsurance = 0;

    for (const row of list) {
      const payment = Number(row.PaymentAmount) || 0;
      totalAmount += payment;
      totalNetTotal += Number(row.NetTotal) || 0;
      totalBalance += Number(row.Balance) || 0;
      totalInsurance += Number(row.InsuranceAmount) || 0;

      if (row.CashAmount !== undefined || row.CardAmount !== undefined) {
        totalCash += Number(row.CashAmount) || 0;
        totalCard += Number(row.CardAmount) || 0;
      } else {
        const mode = (row.PaymentMode || '').toLowerCase();
        if (mode.includes('card') || mode === 'mada') {
          totalCard += payment;
        } else if (mode.includes('cash')) {
          totalCash += payment;
        } else {
          totalCash += payment;
        }
      }
    }

    return {
      TotalCash: totalCash,
      TotalCard: totalCard,
      TotalAmount: totalAmount,
      TotalNetTotal: totalNetTotal,
      TotalBalance: totalBalance,
      TotalInsurance: totalInsurance,
    };
  });

  private initialStoreLoadDone = false;

  constructor() {
    effect(() => {
      const store = this.auth.selectedStore();
      if (!this.initialStoreLoadDone) {
        this.initialStoreLoadDone = true;
        return;
      }
      if (store) {
        untracked(() => {
          void this.loadFramesSalesReport();
        });
      }
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const statusParam = params['status'] as OrderStatusCategory | undefined;
      if (statusParam && ['all', 'completed', 'pending', 'incomplete'].includes(statusParam)) {
        this.selectedStatusFilter.set(statusParam);
      }
      if (params['fromDate']) {
        this.fromDate.set(params['fromDate']);
      }
      if (params['toDate']) {
        this.toDate.set(params['toDate']);
      }
      void this.loadFramesSalesReport();
    });
  }

  protected setStatusFilter(status: OrderStatusCategory): void {
    this.selectedStatusFilter.set(status);
  }

  protected clearStatusFilter(): void {
    this.selectedStatusFilter.set('all');
  }

  protected getCount(category: OrderStatusCategory): number {
    const list = this.reportData();
    if (category === 'all') {
      return list.length;
    }
    return list.filter((row) => this.matchReportStatus(row, category)).length;
  }

  protected getFilterLabel(): string {
    switch (this.selectedStatusFilter()) {
      case 'completed': return 'Completed';
      case 'pending': return 'Pending';
      case 'incomplete': return 'Incomplete';
      default: return 'All';
    }
  }

  private matchReportStatus(row: FramesSalesReportRow, filter: OrderStatusCategory): boolean {
    if (filter === 'all') return true;

    const net = Number(row.NetTotal) || 0;
    const bal = Number(row.Balance) || 0;

    // Follow exact backend SalesController logic matching Dashboard:
    // Completed: Balance <= 0 and NetTotal > 0
    // Pending: Balance > 0 and NetTotal > 0
    // Incomplete: NetTotal <= 0 or cancelled
    if (filter === 'completed') {
      return bal <= 0 && net > 0;
    }
    if (filter === 'pending') {
      return bal > 0 && net > 0;
    }
    if (filter === 'incomplete') {
      return net <= 0;
    }
    return true;
  }

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

  protected async loadFramesSalesReport(): Promise<void> {
    const storeId = this.auth.selectedStore()?.storeId ?? this.auth.user()?.storeId ?? 1;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      // 1. Fetch live order-level data matching the Dashboard
      const orders = await this.reportsService.getOrdersReport(
        this.fromDate(),
        this.toDate(),
        storeId,
      );

      // 2. Fetch frames sales report payments/products data
      let framesReportResult: FramesSalesReportRow[] = [];
      try {
        const framesData = await this.reportsService.getFramesSalesReport(
          this.fromDate(),
          this.toDate(),
          storeId,
        );
        framesReportResult = framesData.objresult ?? [];
      } catch (e) {
        console.warn('Frames sales report fetch note:', e);
      }

      // Group payments and products by SaleID
      const paymentsBySale = new Map<number, FramesSalesReportRow[]>();
      for (const row of framesReportResult) {
        const sid = Number(row.SaleID);
        if (sid) {
          const arr = paymentsBySale.get(sid) ?? [];
          arr.push(row);
          paymentsBySale.set(sid, arr);
        }
      }

      if (orders && orders.length > 0) {
        const storeName = this.auth.selectedStore()?.storeName || 'Naimat Al Basar';

        const combinedRows: FramesSalesReportRow[] = orders.map((o: any) => {
          const saleId = Number(o.SalesId || o.salesId || o.SaleID || o.saleId);
          const invoiceNo = String(o.InvoiceNo || o.invoiceNo || '').trim();
          const paymentRows = paymentsBySale.get(saleId) || [];

          const products = paymentRows.map(p => p.Products).filter(Boolean).join(', ')
            || o.Products || o.products || 'Frames / Lenses';

          const netTotal = Number(o.GrossTotal ?? o.grossTotal ?? o.NetTotal ?? o.netTotal ?? 0);
          const paidAmount = Number(o.PaidAmount ?? o.paidAmount ?? 0);
          const balance = Number(o.Balance ?? o.balance ?? 0);

          let storedCash = 0;
          let storedCard = 0;
          let hasStoredPayments = false;
          try {
            const raw = localStorage.getItem(`eyewa_sales_payments_${saleId}`) ||
              (invoiceNo ? localStorage.getItem(`eyewa_invoice_payments_${invoiceNo}`) : null);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed) && parsed.length > 0) {
                hasStoredPayments = true;
                for (const item of parsed) {
                  storedCash += Number(item.cash) || 0;
                  storedCard += Number(item.card) || 0;
                }
              }
            }
          } catch {}

          let apiCash = 0;
          let apiCard = 0;
          let hasApiPaymentRows = false;
          if (paymentRows.length > 0) {
            hasApiPaymentRows = true;
            for (const pr of paymentRows) {
              const m = (pr.PaymentMode || '').toLowerCase();
              const pAmt = Number(pr.PaymentAmount) || 0;
              if (m.includes('card') || m === 'mada') {
                apiCard += pAmt;
              } else if (m.includes('cash')) {
                apiCash += pAmt;
              }
            }
          }

          let cashAmount = 0;
          let cardAmount = 0;

          if (hasStoredPayments && (storedCash > 0 || storedCard > 0)) {
            cashAmount = storedCash;
            cardAmount = storedCard;
          } else if (hasApiPaymentRows && (apiCash > 0 || apiCard > 0)) {
            cashAmount = apiCash;
            cardAmount = apiCard;
          } else {
            const modeStr = (o.PaymentMode || o.paymentMode || paymentRows[0]?.PaymentMode || 'Cash').toLowerCase();
            if (modeStr.includes('card') || modeStr === 'mada') {
              cardAmount = paidAmount;
            } else if (modeStr.includes('cash')) {
              cashAmount = paidAmount;
            } else {
              cashAmount = paidAmount;
            }
          }

          const sumSplit = cashAmount + cardAmount;
          if (paidAmount > sumSplit && sumSplit > 0) {
            const diff = paidAmount - sumSplit;
            if (cardAmount > 0 && cashAmount === 0) {
              cardAmount += diff;
            } else if (cashAmount > 0 && cardAmount === 0) {
              cashAmount += diff;
            }
          } else if (paidAmount > 0 && sumSplit === 0) {
            cashAmount = paidAmount;
          }

          let displayPaymentMode = 'Cash';
          if (cardAmount > 0 && cashAmount > 0) {
            displayPaymentMode = `Split (Cash: ${cashAmount.toFixed(2)}, Card: ${cardAmount.toFixed(2)})`;
          } else if (cardAmount > 0) {
            displayPaymentMode = 'Card';
          } else {
            displayPaymentMode = 'Cash';
          }

          return {
            SaleID: saleId,
            StoreName: storeName,
            CustomerName: o.CustomerName || o.customerName || 'Walk-in Customer',
            CustomerNo: o.CustomerNo || o.customerNo || '-',
            InvoicePaymentID: paymentRows[0]?.InvoicePaymentID || saleId,
            PaymentDate: o.CreatedDate || o.createdDate || o.InvoiceDate || new Date().toISOString(),
            PaymentAmount: paidAmount,
            PaymentMode: displayPaymentMode,
            InsuranceAmount: Number(o.InsuranceAmount ?? 0),
            NetTotal: netTotal,
            Balance: balance,
            Products: products,
            CashAmount: cashAmount,
            CardAmount: cardAmount,
          };
        });

        this.reportData.set(combinedRows);
      } else {
        // Fallback to frames sales report rows if orders are not returned
        this.reportData.set(framesReportResult);
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
    this.selectedStatusFilter.set('all');
    this.reportData.set([]);
    this.extraData.set(null);
    this.errorMessage.set(null);
  }

  protected onDateChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    if (val) {
      this.fromDate.set(val);
      this.toDate.set(val);
      void this.loadFramesSalesReport();
    }
  }

  protected printReport(): void {
    window.print();
  }

  protected exportToPdf(): void {
    this.printReport();
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

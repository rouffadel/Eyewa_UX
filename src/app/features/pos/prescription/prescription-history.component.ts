import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AppConfigService } from '../../../services/app-config.service';
import { SellSessionStore } from '../sell/services/sell-session.store';

@Component({
  selector: 'app-prescription-history',
  templateUrl: './prescription-history.component.html',
  styleUrl: './prescription-history.component.css',
})
export class PrescriptionHistoryComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly appConfig = inject(AppConfigService);
  protected readonly store = inject(SellSessionStore);

  protected readonly selectedCustomer = computed(() => this.store.selectedCustomer());
  protected readonly history = computed(() => this.store.prescriptionHistory());
  protected readonly loading = computed(() => this.store.prescriptionLoading());
  protected readonly selectedId = signal<string | null>(null);

  protected readonly customerOrders = signal<any[]>([]);
  protected readonly isLoadingOrders = signal<boolean>(false);

  protected readonly totalAmt = computed(() => {
    return this.customerOrders().reduce((sum, o) => sum + (o.grossTotal || 0), 0);
  });
  
  protected readonly totalPaid = computed(() => {
    return this.customerOrders().reduce((sum, o) => sum + (o.paidAmount || 0), 0);
  });
  
  protected readonly totalBalance = computed(() => {
    return this.customerOrders().reduce((sum, o) => sum + (o.balance || 0), 0);
  });

  protected readonly showBulkPaymentModal = signal<boolean>(false);
  protected readonly bulkPaymentAmount = signal<number>(0);
  protected readonly bulkPaymentMode = signal<string>('Cash');

  private getPosApiUrl(): string {
    const settings = this.appConfig.settings as any;
    return settings?.apiUrl?.replace(/\/$/, '') || 'https://localhost:44314/api';
  }

  ngOnInit(): void {
    this.store.ensureSalesDetailsLoaded();

    const customer = this.store.selectedCustomer();
    if (customer?.id) {
      this.store.loadSelectedPrescription(customer.id);
      this.fetchCustomerOrders(customer);
    }
  }

  private fetchCustomerOrders(customer: any) {
    this.isLoadingOrders.set(true);
    const url = `${this.getPosApiUrl()}/sales/order-status-list`;
    this.http.get<any[]>(url).subscribe({
      next: (data) => {
        const filtered = data
          .map(o => {
            const gross = o.GrossTotal || o.grossTotal || 0;
            const paid = o.PaidAmount || o.paidAmount || 0;
            const bal = o.Balance || o.balance || 0;
            const status = o.StatusName || o.statusName || (gross <= 0 ? 'Draft' : (bal <= 0 ? 'Paid' : 'Pending'));

            return {
              salesId: o.SalesId || o.salesId,
              invoiceNo: o.InvoiceNo || o.invoiceNo || (`#${o.SalesId || o.salesId}`),
              customerName: o.CustomerName || o.customerName,
              customerNo: o.CustomerNo || o.customerNo || '',
              productName: o.ProductName || o.productName || 'Multiple Items',
              grossTotal: gross,
              paidAmount: paid,
              balance: bal,
              insuranceAmount: o.InsuranceAmount || o.insuranceAmount || 0,
              discountAmount: o.DiscountAmount || o.discountAmount || o.Discount || o.discount || 0,
              orderStatusId: o.OrderStatusId || o.orderStatusId,
              statusName: status
            };
          })
          .filter(o => 
            (customer.displayName && o.customerName?.toLowerCase() === customer.displayName.toLowerCase()) ||
            (customer.phone && o.customerNo === customer.phone) ||
            (customer.phoneMasked && o.customerNo === customer.phoneMasked)
          );
        this.customerOrders.set(filtered);
        this.isLoadingOrders.set(false);
      },
      error: (err) => {
        console.error('Failed to load customer orders', err);
        this.isLoadingOrders.set(false);
      }
    });
  }

  constructor() {
    effect(() => {
      const history = this.history();
      const currentSelection = this.selectedId();
      const storeSelection = this.store.selectedPrescriptionId();

      if (history.length === 0) {
        this.selectedId.set(null);
        return;
      }

      if (currentSelection && history.some((entry) => entry.id === currentSelection)) {
        return;
      }

      if (storeSelection && history.some((entry) => entry.id === storeSelection)) {
        this.selectedId.set(storeSelection);
        return;
      }

      this.selectedId.set(history[0]?.id ?? null);
    });
  }

  protected onSelect(prescriptionId: string): void {
    this.selectedId.set(prescriptionId);
    this.store.selectPrescriptionFromHistory(prescriptionId);
  }

  protected onViewOrder(order: any): void {
    const customer = this.selectedCustomer();
    if (customer) {
      this.store.selectCustomer({ ...customer, salesId: order.salesId });
      void this.router.navigate(['/home/sell']);
    }
  }

  protected onMakeBulkPayment(): void {
    this.bulkPaymentAmount.set(this.totalBalance());
    this.bulkPaymentMode.set('Cash');
    this.showBulkPaymentModal.set(true);
  }

  protected onCloseBulkModal(): void {
    this.showBulkPaymentModal.set(false);
  }

  protected async onSubmitBulkPayment(): Promise<void> {
    const paymentAmount = this.bulkPaymentAmount();
    if (paymentAmount <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    const customer = this.selectedCustomer();
    if (!customer) {
      return;
    }

    this.isLoadingOrders.set(true);

    try {
      // Sort oldest orders first (lower salesId = older order)
      const oldestFirst = [...this.customerOrders()].sort((a, b) => a.salesId - b.salesId);
      let remainingPayment = paymentAmount;

      for (const order of oldestFirst) {
        if (remainingPayment <= 0) break;

        const unpaidBalance = order.balance;
        if (unpaidBalance <= 0) continue;

        const payVal = Math.min(unpaidBalance, remainingPayment);

        const requestBody = {
          salesId: order.salesId,
          paymentAmount: payVal,
          paymentMode: this.bulkPaymentMode()
        };

        const response = await this.http.post<any>(`${this.getPosApiUrl()}/sales/record-payment`, requestBody).toPromise();

        if (response && response.status === '200') {
          remainingPayment -= payVal;
        } else {
          console.error(`Failed to record payment for order ${order.salesId}`);
        }
      }

      this.showBulkPaymentModal.set(false);
      this.fetchCustomerOrders(customer);
      this.store.ensureSalesDetailsLoaded();
    } catch (err) {
      console.error('Error executing bulk payment', err);
      alert('Failed to complete bulk payment.');
      this.isLoadingOrders.set(false);
    }
  }



  protected onViewSelected(): void {
    const prescriptionId = this.selectedId();
    if (!prescriptionId) {
      return;
    }

    this.store.selectPrescriptionFromHistory(prescriptionId);
    void this.router.navigate(['/home/sell']);
  }

  protected onBackToSell(): void {
    void this.router.navigate(['/home/sell']);
  }

  protected onNewPrescription(): void {
    void this.router.navigate(['/home/prescription']);
  }
}

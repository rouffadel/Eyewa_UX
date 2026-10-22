import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AppConfigService } from '../../../../services/app-config.service';
import { TranslationService } from '../../../../services/translation.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { Customer } from '../../sell/models/customer.models';
import { CustomerService } from '../services/customer.service';

@Component({
  selector: 'app-customer-order-history-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './customer-order-history-modal.component.html',
  styleUrl: './customer-order-history-modal.component.css'
})
export class CustomerOrderHistoryModalComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly appConfig = inject(AppConfigService);
  private readonly translationService = inject(TranslationService);
  private readonly customerService = inject(CustomerService);

  readonly customer = input.required<Customer>();

  readonly close = output<void>();
  readonly startSale = output<Customer>();
  readonly viewInvoice = output<{ customer: Customer; order: any }>();
  readonly editOrder = output<{ customer: Customer; order: any }>();

  protected readonly orders = signal<any[]>([]);
  protected readonly statuses = signal<any[]>([]);
  protected readonly isLoadingOrders = signal<boolean>(false);
  protected readonly loyaltyPoints = signal<number | null>(null);
  protected readonly feedbackMessage = signal<{ text: string; type: 'success' | 'error' } | null>(null);

  protected readonly editingOrder = signal<any | null>(null);
  protected readonly selectedStatusId = signal<number | null>(null);
  protected readonly isUpdatingStatus = signal<boolean>(false);
  protected readonly isNavigatingInvoice = signal<number | null>(null);

  protected readonly customerInitials = computed(() => {
    const c = this.customer();
    if (c.initials) return c.initials;
    const name = c.displayName || 'Customer';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'C';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  });

  ngOnInit(): void {
    const c = this.customer();
    this.loyaltyPoints.set(c.loyaltyPoints ?? null);

    if (c.loyaltyPoints == null && (c.phone || c.phoneMasked)) {
      const phone = c.phone || c.phoneMasked;
      this.customerService.getCustomerLoyaltyPoints(phone).then((pts) => {
        this.loyaltyPoints.set(pts);
      }).catch(() => {});
    }

    this.fetchStatuses();
    this.fetchOrders();
  }

  protected onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.onClose();
    }
  }

  protected onClose(): void {
    this.close.emit();
  }

  protected onStartSale(): void {
    this.startSale.emit(this.customer());
  }

  protected onViewInvoice(order: any): void {
    this.isNavigatingInvoice.set(order.salesId);
    this.viewInvoice.emit({ customer: this.customer(), order });
  }

  protected onEditOrder(order: any): void {
    this.editOrder.emit({ customer: this.customer(), order });
  }

  protected onOpenStatusEdit(order: any): void {
    this.editingOrder.set(order);
    this.selectedStatusId.set(order.orderStatusId || null);
    this.feedbackMessage.set(null);
  }

  protected onCloseStatusEdit(): void {
    this.editingOrder.set(null);
    this.selectedStatusId.set(null);
  }

  protected onSaveStatus(): void {
    const order = this.editingOrder();
    const statusId = this.selectedStatusId();
    if (!order || !statusId) return;

    this.isUpdatingStatus.set(true);
    const url = `${this.getPosApiUrl()}/sales/${order.salesId}/status`;

    this.http.put(url, statusId).subscribe({
      next: () => {
        this.isUpdatingStatus.set(false);
        const statusObj = this.statuses().find((s) => s.id === statusId);

        // Update local orders list
        this.orders.update((list) =>
          list.map((o) =>
            o.salesId === order.salesId
              ? { ...o, orderStatusId: statusId, statusName: statusObj?.statusName || o.statusName }
              : o
          )
        );

        this.feedbackMessage.set({
          text: this.translationService.translate('customerHistory.statusUpdated'),
          type: 'success'
        });
        this.onCloseStatusEdit();
      },
      error: (err) => {
        console.error('Failed to update status', err);
        this.isUpdatingStatus.set(false);
        this.feedbackMessage.set({
          text: 'Failed to update order status. Please try again.',
          type: 'error'
        });
      }
    });
  }

  protected getStatusDisplayName(name: string): string {
    if (!name) return '';
    const lower = name.toLowerCase().trim().replace(/\s+/g, '');
    if (lower === 'created') return this.translationService.translate('status.created');
    if (lower === 'inprogress') return this.translationService.translate('status.inProgress');
    if (lower === 'ready') return this.translationService.translate('status.ready');
    if (lower === 'delivered') return this.translationService.translate('status.delivered');
    if (lower === 'completed') return this.translationService.translate('status.completed');
    if (lower === 'pending') return this.translationService.translate('status.pending');
    if (lower === 'incomplete') return this.translationService.translate('status.incomplete');
    return name;
  }

  protected getStatusBadgeClass(name: string): string {
    if (!name) return '';
    const lower = name.toLowerCase().trim().replace(/\s+/g, '');
    if (lower === 'ready') return 'badge-ready';
    if (lower === 'delivered' || lower === 'completed') return 'badge-delivered';
    if (lower === 'pending') return 'badge-pending';
    if (lower === 'inprogress') return 'badge-inprogress';
    return '';
  }

  private getPosApiUrl(): string {
    const settings = this.appConfig.settings as any;
    return settings?.apiUrl?.replace(/\/$/, '') || 'https://localhost:7207/api';
  }

  private fetchStatuses(): void {
    this.http.get<any[]>(`${this.getPosApiUrl()}/sales/statuses`).subscribe({
      next: (data) => {
        const mappedData = data.map((s) => ({
          id: s.Id || s.id,
          statusName: s.StatusName || s.statusName,
          isActive: s.IsActive !== undefined ? s.IsActive : s.isActive
        }));
        this.statuses.set(mappedData.filter((s) => s.isActive));
      },
      error: (err) => {
        console.error('Failed to load statuses', err);
      }
    });
  }

  private fetchOrders(): void {
    this.isLoadingOrders.set(true);
    const c = this.customer();
    const searchTerm = c.phone || c.phoneMasked || c.displayName;
    const url = `${this.getPosApiUrl()}/sales/order-status-list?search=${encodeURIComponent(searchTerm)}`;

    this.http.get<any>(url).subscribe({
      next: (data) => {
        const rawList: any[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.result)
          ? data.result
          : Array.isArray(data?.data)
          ? data.data
          : [];

        this.orders.set(
          rawList.map((o) => ({
            salesId: o.SalesId || o.salesId,
            invoiceNo: o.InvoiceNo || o.invoiceNo || `#${o.SalesId || o.salesId}`,
            customerName: o.CustomerName || o.customerName,
            customerNo: o.CustomerNo || o.customerNo || '',
            productName: o.ProductName || o.productName || 'Multiple Items',
            grossTotal: o.GrossTotal || o.grossTotal,
            paidAmount: o.PaidAmount || o.paidAmount,
            balance: o.Balance || o.balance,
            discountAmount: o.DiscountAmount || o.discountAmount || o.Discount || o.discount || 0,
            orderStatusId: o.OrderStatusId || o.orderStatusId,
            statusName: o.StatusName || o.statusName
          }))
        );
        this.isLoadingOrders.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch customer orders', err);
        this.isLoadingOrders.set(false);
      }
    });
  }
}

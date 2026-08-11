import { Component, inject, OnInit, signal, computed, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AppConfigService } from '../../../services/app-config.service';

@Component({
  selector: 'app-status-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './status-page.component.html',
  styleUrl: './status-page.component.css'
})
export class StatusPageComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly appConfig = inject(AppConfigService);
  private readonly elementRef = inject(ElementRef);

  protected readonly statuses = signal<any[]>([]);
  protected readonly orders = signal<any[]>([]);
  protected readonly selectedOrder = signal<any | null>(null);
  protected readonly selectedStatusId = signal<number | null>(null);
  
  protected readonly isOpen = signal(false);

  protected toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.isOpen.update((v) => !v);
  }

  protected selectStatus(id: number | null): void {
    this.selectedStatusId.set(id);
    this.isOpen.set(false);
  }

  protected currentStatusName(): string {
    const id = this.selectedStatusId();
    if (id == null) return '-- Select a Status --';
    const statusObj = this.statuses().find((s) => s.id === id);
    return statusObj ? statusObj.statusName : '-- Select a Status --';
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  protected readonly isLoadingStatuses = signal<boolean>(false);
  protected readonly isLoadingOrders = signal<boolean>(false);
  protected readonly isUpdating = signal<boolean>(false);
  protected readonly message = signal<{ text: string, type: 'success' | 'error' } | null>(null);

  searchTerm = signal<string>('');

  // Computed signal to filter orders by Customer No or Invoice No
  filteredOrders = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    if (!search) return this.orders();
    
    return this.orders().filter(o => 
      (o.customerNo && o.customerNo.toLowerCase().includes(search)) ||
      (o.invoiceNo && o.invoiceNo.toLowerCase().includes(search)) ||
      (o.salesId && o.salesId.toString().includes(search))
    );
  });

  ngOnInit() {
    this.fetchStatuses();
    this.fetchOrders();
  }

  private getPosApiUrl(): string {
    const settings = this.appConfig.settings as any;
    return settings?.apiUrl?.replace(/\/$/, '') || 'https://localhost:44314/api';
  }

  private fetchStatuses() {
    this.isLoadingStatuses.set(true);
    this.http.get<any[]>(`${this.getPosApiUrl()}/sales/statuses`).subscribe({
      next: (data) => {
        const mappedData = data.map(s => ({
          id: s.Id || s.id,
          statusName: s.StatusName || s.statusName,
          message: s.Message || s.message,
          sendNotification: s.SendNotification !== undefined ? s.SendNotification : s.sendNotification,
          isActive: s.IsActive !== undefined ? s.IsActive : s.isActive
        }));
        this.statuses.set(mappedData.filter(s => s.isActive));
        this.isLoadingStatuses.set(false);
      },
      error: (err) => {
        console.error('Failed to load statuses from POS API', err);
        this.message.set({ text: 'Failed to load statuses. Ensure POS API is running.', type: 'error' });
        this.isLoadingStatuses.set(false);
      }
    });
  }

  private fetchOrders() {
    this.isLoadingOrders.set(true);
    this.http.get<any[]>(`${this.getPosApiUrl()}/sales/order-status-list`).subscribe({
      next: (data) => {
        this.orders.set(data.map(o => ({
          salesId: o.SalesId || o.salesId,
          invoiceNo: o.InvoiceNo || o.invoiceNo || (`#${o.SalesId || o.salesId}`),
          customerName: o.CustomerName || o.customerName,
          customerNo: o.CustomerNo || o.customerNo || '',
          productName: o.ProductName || o.productName || 'Multiple Items',
          grossTotal: o.GrossTotal || o.grossTotal,
          paidAmount: o.PaidAmount || o.paidAmount,
          balance: o.Balance || o.balance,
          insuranceAmount: o.InsuranceAmount || o.insuranceAmount || 0,
          discountAmount: o.DiscountAmount || o.discountAmount || o.Discount || o.discount || 0,
          orderStatusId: o.OrderStatusId || o.orderStatusId,
          statusName: o.StatusName || o.statusName
        })));
        this.isLoadingOrders.set(false);
      },
      error: (err) => {
        console.error('Failed to load orders', err);
        this.message.set({ text: 'Failed to load orders from POS API.', type: 'error' });
        this.isLoadingOrders.set(false);
      }
    });
  }

  protected editOrder(order: any) {
    this.selectedOrder.set(order);
    this.selectedStatusId.set(order.orderStatusId || null);
    this.message.set(null);
  }

  protected cancelEdit() {
    this.selectedOrder.set(null);
    this.selectedStatusId.set(null);
    this.message.set(null);
  }

  protected updateStatus() {
    const order = this.selectedOrder();
    if (!order || !this.selectedStatusId()) {
      this.message.set({ text: 'Please select an order and a status.', type: 'error' });
      return;
    }

    this.isUpdating.set(true);
    this.message.set(null);

    const url = `${this.getPosApiUrl()}/sales/${order.salesId}/status`;
    
    // The backend expects just the integer, not an object: [FromBody] int statusId
    this.http.put(url, this.selectedStatusId()).subscribe({
      next: () => {
        this.isUpdating.set(false);
        this.message.set({ text: 'Order status updated successfully and notification sent!', type: 'success' });
        
        // Update grid data
        const updatedOrders = this.orders().map(o => {
          if (o.salesId === order.salesId) {
            const newStatus = this.statuses().find(s => s.id == this.selectedStatusId());
            return { ...o, orderStatusId: this.selectedStatusId(), statusName: newStatus?.statusName };
          }
          return o;
        });
        this.orders.set(updatedOrders);
        this.selectedOrder.set(null);
        this.selectedStatusId.set(null);
      },
      error: (err) => {
        console.error('Failed to update status', err);
        this.isUpdating.set(false);
        let errorMsg = 'Failed to update order status.';
        if (err.status === 404) {
          errorMsg = 'Order not found or invalid Order ID.';
        }
        this.message.set({ text: errorMsg, type: 'error' });
      }
    });
  }
}

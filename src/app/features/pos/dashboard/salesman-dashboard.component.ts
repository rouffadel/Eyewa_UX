import { Component, OnInit, inject, signal, computed, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../auth/services/auth.service';
import { AppConfigService } from '../../../services/app-config.service';

import { DashboardCacheService } from './services/dashboard-cache.service';
import { categorizeOrderStatus, OrderStatusCategory } from '../shared/order-status.utils';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { SellSessionStore } from '../sell/services/sell-session.store';
import { Customer } from '../sell/models/customer.models';

export interface RecentOrder {
  id: number;
  orderNo: string;
  customerName: string;
  mobileNumber: string;
  orderType: string;
  amount: number;
  status: 'Completed' | 'Pending' | 'Incomplete' | string;
  dateTime: string;
  salesId: number;
}

export interface DashboardSummary {
  totalOrdersCount: number;
  completedCount: number;
  pendingCount: number;
  incompleteCount: number;
}

@Component({
  selector: 'app-salesman-dashboard',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './salesman-dashboard.component.html',
  styleUrl: './salesman-dashboard.component.css'
})
export class SalesmanDashboardComponent implements OnInit {
  protected readonly Math = Math;
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly appConfig = inject(AppConfigService);
  private readonly cacheService = inject(DashboardCacheService);
  private readonly sellStore = inject(SellSessionStore);

  protected readonly isLoading = signal<boolean>(true);
  protected readonly orders = signal<RecentOrder[]>([]);

  // Slice latest 5 orders for the recent orders table
  protected readonly recentOrders = computed<RecentOrder[]>(() => {
    return this.orders().slice(0, 5);
  });

  // Status summary for last 2 months from API
  protected readonly statusSummary = signal<{
    totalInvoices: number;
    completed: number;
    pending: number;
    incomplete: number;
    completedAmount: number;
    pendingAmount: number;
    incompleteAmount: number;
  } | null>(null);

  // Calculate summary metrics dynamically for cards & charts
  protected readonly summary = computed<DashboardSummary>(() => {
    const apiSummary = this.statusSummary();
    if (apiSummary) {
      return {
        totalOrdersCount: apiSummary.totalInvoices ?? 0,
        completedCount: apiSummary.completed ?? 0,
        pendingCount: apiSummary.pending ?? 0,
        incompleteCount: apiSummary.incomplete ?? 0
      };
    }

    const list = this.orders();
    if (!list || list.length === 0) {
      return {
        totalOrdersCount: 0,
        completedCount: 0,
        pendingCount: 0,
        incompleteCount: 0
      };
    }

    const totalOrdersCount = list.length;
    let completedCount = 0;
    let pendingCount = 0;
    let incompleteCount = 0;

    for (const item of list) {
      const category = categorizeOrderStatus(item.status);
      if (category === 'completed') {
        completedCount++;
      } else if (category === 'incomplete') {
        incompleteCount++;
      } else {
        pendingCount++;
      }
    }

    return {
      totalOrdersCount,
      completedCount,
      pendingCount,
      incompleteCount
    };
  });

  // Maximum value for bar chart scaling
  protected readonly maxChartValue = computed(() => {
    const s = this.summary();
    const max = Math.max(s.completedCount, s.pendingCount, s.incompleteCount, 1);
    return Math.ceil(max * 1.25);
  });

  protected readonly salesmanName = computed(() => {
    const user = this.authService.user();
    if (user?.loginName) return user.loginName;
    if (this.authService.currentSession()?.displayName) {
      return this.authService.currentSession()?.displayName;
    }
    return 'Salesman';
  });

  protected readonly formattedDate = computed(() => {
    const today = new Date();
    return today.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  });

  constructor() {
    effect(() => {
      const selected = this.authService.selectedStore();
      const user = this.authService.user();
      const storeId = selected?.storeId ?? user?.storeId ?? 1;

      untracked(() => {
        this.getSalesStatusSummary(storeId);
        this.fetchDashboardData(storeId);
      });
    });
  }

  ngOnInit(): void {
    // Initial fetch handled reactively by constructor effect
  }

  private getSelectedStoreId(): number {
    return this.authService.selectedStore()?.storeId ?? this.authService.user()?.storeId ?? 1;
  }

  private getSalesStatusSummary(storeId?: number): void {
    const targetStoreId = storeId ?? this.getSelectedStoreId();
    let url = `${this.getPosApiUrl()}/sales/sales-status-summary`;
    if (targetStoreId && targetStoreId > 0) {
      url += `?storeId=${targetStoreId}`;
    }
    this.http.get<any>(url).subscribe({
      next: (res) => {
        if (res) {
          this.statusSummary.set({
            totalInvoices: res.totalInvoices ?? res.TotalInvoices ?? 0,
            completed: res.completed ?? res.Completed ?? 0,
            pending: res.pending ?? res.Pending ?? 0,
            incomplete: res.incomplete ?? res.Incomplete ?? 0,
            completedAmount: res.completedAmount ?? res.CompletedAmount ?? 0,
            pendingAmount: res.pendingAmount ?? res.PendingAmount ?? 0,
            incompleteAmount: res.incompleteAmount ?? res.IncompleteAmount ?? 0
          });
        }
      },
      error: (err) => {
        console.error('Failed to fetch sales status summary:', err);
      }
    });
  }

  protected navigateToAddOrder(): void {
    void this.router.navigate(['/home', 'sell']);
  }

  protected navigateToStatus(statusFilter: OrderStatusCategory = 'all'): void {
    void this.router.navigate(['/home', 'status'], {
      queryParams: { status: statusFilter }
    });
  }

  protected navigateToReports(statusFilter: OrderStatusCategory = 'all'): void {
    const todayStr = new Date().toISOString().split('T')[0];
    void this.router.navigate(['/home', 'reports'], {
      queryParams: {
        status: statusFilter,
        fromDate: todayStr,
        toDate: todayStr
      }
    });
  }

  protected async viewOrderDetails(order: RecentOrder): Promise<void> {
    if (order.salesId) {
      try {
        const customer: Customer = {
          id: order.mobileNumber && order.mobileNumber !== '-' ? order.mobileNumber : String(order.salesId),
          displayName: order.customerName || 'Walk-in Customer',
          initials: (order.customerName || 'W').substring(0, 2).toUpperCase(),
          phoneMasked: order.mobileNumber && order.mobileNumber !== '-' ? order.mobileNumber : '',
          phone: order.mobileNumber && order.mobileNumber !== '-' ? order.mobileNumber : '',
          loyaltyPoints: 0,
          lastVisit: 'Recent',
          invoiceNo: order.orderNo,
          salesId: order.salesId,
        };
        await this.sellStore.prepareOrderInvoice(customer, order);
      } catch (err) {
        console.error('Failed to prepare invoice for recent order:', err);
      }

      void this.router.navigate(['/home', 'sell', 'invoice'], {
        queryParams: { salesId: order.salesId }
      });
    } else {
      void this.router.navigate(['/home', 'status']);
    }
  }

  private getPosApiUrl(): string {
    const settings = this.appConfig.settings as any;
    return settings?.apiUrl?.replace(/\/$/, '') || 'https://localhost:7207/api';
  }

  private fetchDashboardData(storeId?: number): void {
    const targetStoreId = storeId ?? this.getSelectedStoreId();
    const cached = this.cacheService.getCachedOrders(targetStoreId);
    if (cached && cached.length > 0) {
      this.orders.set(cached);
      this.isLoading.set(false);
    } else {
      this.isLoading.set(true);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    let url = `${this.getPosApiUrl()}/sales/order-status-list?take=5&fromDate=${todayStr}&toDate=${todayStr}`;
    if (targetStoreId && targetStoreId > 0) {
      url += `&storeId=${targetStoreId}`;
    }

    this.http.get<any>(url).subscribe({
      next: (data) => {
        const rawList: any[] = Array.isArray(data)
          ? data
          : (Array.isArray(data?.result)
              ? data.result
              : (Array.isArray(data?.data)
                  ? data.data
                  : (Array.isArray(data?.objresult) ? data.objresult : [])));

        if (rawList && rawList.length > 0) {
          const mapped: RecentOrder[] = rawList.map((o, idx) => {
            const salesId = o.SalesId || o.salesId || o.SaleID || o.saleId || (idx + 1);
            const invNo = o.InvoiceNo || o.invoiceNo;
            const orderNo = invNo ? (invNo.startsWith('#') ? invNo : `#${invNo}`) : `#${salesId}`;
            const customerName = o.CustomerName || o.customerName || 'Walk-in Customer';
            const mobileNumber = o.CustomerNo || o.customerNo || o.MobileNumber || o.mobileNumber || '-';
            const grossTotal = o.GrossTotal ?? o.grossTotal ?? o.TotalAmount ?? o.totalAmount ?? 0;
            const statusRaw = o.StatusName || o.statusName || 'Completed';
            const createdDateRaw = o.CreatedDate || o.createdDate || o.Date || o.date;

            let formattedTime = this.formattedDate();
            if (createdDateRaw) {
              try {
                const d = new Date(createdDateRaw);
                if (!isNaN(d.getTime())) {
                  formattedTime = d.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                }
              } catch {
                // Keep default
              }
            }

            return {
              id: idx + 1,
              salesId,
              orderNo,
              customerName,
              mobileNumber,
              orderType: 'Sales',
              amount: Number(grossTotal) || 0,
              status: statusRaw,
              dateTime: formattedTime
            };
          });

          this.orders.set(mapped);
          this.cacheService.setCachedOrders(mapped, targetStoreId);
        } else if (Array.isArray(data) || data?.status === '200' || data?.Status === '200') {
          // Valid API response with 0 live orders
          this.orders.set([]);
          this.cacheService.setCachedOrders([], targetStoreId);
        } else {
          // Unexpected non-array format, fallback to empty list
          console.warn('POS API returned non-array payload:', data);
          if (!cached) {
            this.orders.set([]);
            this.cacheService.setCachedOrders([], targetStoreId);
          }
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('API connection error while fetching live order status list:', err);
        if (!cached) {
          this.orders.set([]);
          this.cacheService.setCachedOrders([], targetStoreId);
        }
        this.isLoading.set(false);
      }
    });
  }
}

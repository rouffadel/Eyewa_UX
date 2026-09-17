import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../auth/services/auth.service';
import { AppConfigService } from '../../../services/app-config.service';

import { DashboardCacheService } from './services/dashboard-cache.service';
import { categorizeOrderStatus, OrderStatusCategory } from '../shared/order-status.utils';

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
  imports: [CommonModule],
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

  protected readonly isLoading = signal<boolean>(true);
  protected readonly orders = signal<RecentOrder[]>([]);

  // Slice latest 5 orders for the recent orders table
  protected readonly recentOrders = computed<RecentOrder[]>(() => {
    return this.orders().slice(0, 5);
  });

  // Calculate summary metrics dynamically from orders signal
  protected readonly summary = computed<DashboardSummary>(() => {
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

  ngOnInit(): void {
    this.fetchDashboardData();
  }

  protected navigateToAddOrder(): void {
    void this.router.navigate(['/home', 'prescription']);
  }

  protected navigateToStatus(statusFilter: OrderStatusCategory = 'all'): void {
    void this.router.navigate(['/home', 'status'], {
      queryParams: { status: statusFilter }
    });
  }

  protected viewOrderDetails(order: RecentOrder): void {
    if (order.salesId) {
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

  private fetchDashboardData(): void {
    const cached = this.cacheService.getCachedOrders();
    if (cached && cached.length > 0) {
      this.orders.set(cached);
      this.isLoading.set(false);
    } else {
      this.isLoading.set(true);
    }

    const url = `${this.getPosApiUrl()}/sales/order-status-list`;

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
          this.cacheService.setCachedOrders(mapped);
        } else if (Array.isArray(data) || data?.status === '200' || data?.Status === '200') {
          // Valid API response with 0 live orders
          this.orders.set([]);
          this.cacheService.setCachedOrders([]);
        } else {
          // Unexpected non-array format, fallback safely
          console.warn('POS API returned non-array payload:', data);
          if (!cached) {
            this.setFallbackData();
          }
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('API connection error while fetching live order status list:', err);
        if (!cached) {
          this.setFallbackData();
        }
        this.isLoading.set(false);
      }
    });
  }

  private setFallbackData(): void {
    this.orders.set([
      {
        id: 1,
        salesId: 1024,
        orderNo: '#1024',
        customerName: 'Sara Khan',
        mobileNumber: '+91 98765 43210',
        orderType: 'Sales',
        amount: 4250.00,
        status: 'Completed',
        dateTime: '16 Sep 2025, 10:24 AM'
      },
      {
        id: 2,
        salesId: 1023,
        orderNo: '#1023',
        customerName: 'Ahmed Raza',
        mobileNumber: '+91 87654 32109',
        orderType: 'Sales',
        amount: 2890.00,
        status: 'Pending',
        dateTime: '16 Sep 2025, 09:17 AM'
      },
      {
        id: 3,
        salesId: 1022,
        orderNo: '#1022',
        customerName: 'Fatima Ali',
        mobileNumber: '+91 76543 21098',
        orderType: 'Sales',
        amount: 3560.00,
        status: 'Incomplete',
        dateTime: '15 Sep 2025, 06:42 PM'
      },
      {
        id: 4,
        salesId: 1021,
        orderNo: '#1021',
        customerName: 'Usman Sheikh',
        mobileNumber: '+91 65432 10987',
        orderType: 'Sales',
        amount: 5120.00,
        status: 'Completed',
        dateTime: '15 Sep 2025, 04:20 PM'
      },
      {
        id: 5,
        salesId: 1020,
        orderNo: '#1020',
        customerName: 'Ayesha Begum',
        mobileNumber: '+91 54321 09876',
        orderType: 'Sales',
        amount: 1980.00,
        status: 'Pending',
        dateTime: '15 Sep 2025, 01:15 PM'
      }
    ]);
  }
}

import { Injectable, signal } from '@angular/core';
import { RecentOrder } from '../salesman-dashboard.component';

@Injectable({ providedIn: 'root' })
export class DashboardCacheService {
  private readonly cachedOrders = signal<RecentOrder[] | null>(null);

  getCachedOrders(): RecentOrder[] | null {
    return this.cachedOrders();
  }

  setCachedOrders(orders: RecentOrder[]): void {
    this.cachedOrders.set(orders);
  }

  clear(): void {
    this.cachedOrders.set(null);
  }
}

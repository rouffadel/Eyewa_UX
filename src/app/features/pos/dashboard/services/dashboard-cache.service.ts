import { Injectable, signal } from '@angular/core';
import { RecentOrder } from '../salesman-dashboard.component';

@Injectable({ providedIn: 'root' })
export class DashboardCacheService {
  private cachedStoreId: number | null = null;
  private readonly cachedOrders = signal<RecentOrder[] | null>(null);

  getCachedOrders(storeId?: number): RecentOrder[] | null {
    if (storeId != null && this.cachedStoreId !== storeId) {
      return null;
    }
    return this.cachedOrders();
  }

  setCachedOrders(orders: RecentOrder[], storeId?: number): void {
    this.cachedStoreId = storeId ?? null;
    this.cachedOrders.set(orders);
  }

  clear(): void {
    this.cachedStoreId = null;
    this.cachedOrders.set(null);
  }
}

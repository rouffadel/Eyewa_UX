import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PosTab } from '../../../shared/models/pos-tab';
import { SellSessionStore } from '../sell/services/sell-session.store';
import { normalizeBalanceThreshold } from '../sell/services/payment.service';

export interface ShortcutItem {
  id: PosTab;
  title: string;
  subtitle: string;
  badge?: string | number;
  icon: string;
  route: string;
}

export type KpiDetailType = 'orders' | 'revenue' | 'pending' | 'offers';

export interface DashboardOrder {
  id: string;
  customerName: string;
  phone: string;
  itemsCount: number;
  totalAmount: number;
  paidAmount: number;
  status: 'Completed' | 'Pending Lab' | 'In Transit' | 'Ready for Pickup';
  paymentMethod: string;
  time: string;
}

@Component({
  selector: 'app-dashboard-hero-banner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-hero-banner.component.html',
  styleUrl: './dashboard-hero-banner.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardHeroBannerComponent {
  private readonly router = inject(Router);
  protected readonly sellStore = inject(SellSessionStore);

  readonly activeTab = input<PosTab>('sell');
  readonly navigateTab = output<PosTab>();

  // Dashboard Expansion & KPI Detail State
  protected readonly isDashboardVisible = signal<boolean>(true);
  protected readonly selectedKpi = signal<KpiDetailType | null>(null);
  protected readonly kpiSearchQuery = signal<string>('');

  protected toggleDashboardVisibility(): void {
    this.isDashboardVisible.update((v) => !v);
  }

  // Dynamic Orders signal derived from active customer cart & store state
  protected readonly dynamicOrders = computed<DashboardOrder[]>(() => {
    const customer = this.sellStore.selectedCustomer();
    const cartItems = this.sellStore.cartItems();
    const totals = this.sellStore.paymentTotals();
    const draft = this.sellStore.paymentDraft();
    const paidAlready = this.sellStore.amountAlreadyPaid();

    const orders: DashboardOrder[] = [];

    // Active Cart Order Session if items exist
    if (cartItems.length > 0) {
      orders.push({
        id: 'ORD-ACTIVE-01',
        customerName: customer ? customer.displayName : 'Guest / Walk-in',
        phone: customer ? customer.phoneMasked : 'N/A',
        itemsCount: cartItems.length,
        totalAmount: totals.payable || totals.total,
        paidAmount: paidAlready,
        status: paidAlready >= (totals.payable || totals.total) && totals.payable > 0 ? 'Completed' : 'Pending Lab',
        paymentMethod: draft.method.toUpperCase(),
        time: 'Active Now',
      });
    }

    // Registered store orders for dynamic view
    orders.push(
      {
        id: 'ORD-2026-1042',
        customerName: customer ? customer.displayName : 'Ahmad Al-Mansoor',
        phone: customer ? customer.phoneMasked : '+966 50 123 4567',
        itemsCount: 2,
        totalAmount: 1250.00,
        paidAmount: 1250.00,
        status: 'Completed',
        paymentMethod: 'CREDIT CARD',
        time: '10:14 AM',
      },
      {
        id: 'ORD-2026-1041',
        customerName: 'Sarah Jenkins',
        phone: '+966 55 987 6543',
        itemsCount: 1,
        totalAmount: 890.00,
        paidAmount: 450.00,
        status: 'Pending Lab',
        paymentMethod: 'CASH / CARD',
        time: '09:45 AM',
      },
      {
        id: 'ORD-2026-1040',
        customerName: 'Fahad Qasim',
        phone: '+966 54 321 0987',
        itemsCount: 3,
        totalAmount: 2400.00,
        paidAmount: 2400.00,
        status: 'Ready for Pickup',
        paymentMethod: 'INSURANCE CLAIM',
        time: '09:12 AM',
      },
      {
        id: 'ORD-2026-1039',
        customerName: 'Laila Mahmoud',
        phone: '+966 56 654 3210',
        itemsCount: 1,
        totalAmount: 620.00,
        paidAmount: 0.00,
        status: 'In Transit',
        paymentMethod: 'UNPAID',
        time: '08:30 AM',
      },
    );

    return orders;
  });

  // Dynamic active offers signal derived from SellSessionStore
  protected readonly dynamicOffers = computed(() => {
    const apiOffers = this.sellStore.activeOffers();

    if (apiOffers && apiOffers.length > 0) {
      return apiOffers.map((o: any) => ({
        code: o.offerCode || o.code || 'COUPON',
        title: o.title || o.offerName || 'Special Offer',
        discountText: o.description || `${o.discountValue || 15}% OFF on selected items`,
        minSpend: o.minAmount || 0,
        validUntil: o.expiryDate || 'Active Now',
      }));
    }

    return [
      {
        code: 'EYEWA20',
        title: 'Summer Frames Special',
        discountText: '20% OFF on all prescription frames',
        minSpend: 500,
        validUntil: 'Sep 30, 2026',
      },
      {
        code: 'LENSBOGO',
        title: 'Buy 1 Get 1 Contact Lenses',
        discountText: 'Buy 1 box, get 2nd box at 50% OFF',
        minSpend: 300,
        validUntil: 'Oct 15, 2026',
      },
      {
        code: 'VIPINSURE',
        title: 'Insurance Co-pay Discount',
        discountText: 'Zero co-pay on premium anti-glare coating',
        minSpend: 800,
        validUntil: 'Dec 31, 2026',
      },
    ];
  });

  protected readonly shortcuts: ShortcutItem[] = [
    {
      id: 'sell',
      title: 'POS Sell Counter',
      subtitle: 'Checkout & Cart',
      icon: 'cart',
      route: '/home/sell',
    },
    {
      id: 'prescription',
      title: 'Prescriptions',
      subtitle: 'Rx Form & Records',
      badge: 'Rx',
      icon: 'prescription',
      route: '/home/prescription',
    },
    {
      id: 'reports',
      title: 'Reports & Analytics',
      subtitle: 'Sales & Revenue Summary',
      icon: 'reports',
      route: '/home/reports',
    },
    {
      id: 'deliveries',
      title: 'Deliveries',
      subtitle: 'Order Tracking & Shipping',
      badge: 3,
      icon: 'deliveries',
      route: '/home/deliveries',
    },
    {
      id: 'status',
      title: 'Order Status',
      subtitle: 'Real-time Lab & Store Status',
      icon: 'status',
      route: '/home/status',
    },
    {
      id: 'insurance',
      title: 'Insurance Claims',
      subtitle: 'Pre-auth & Approval Status',
      icon: 'insurance',
      route: '/home/insurance',
    },
  ];

  protected onNavigate(shortcut: ShortcutItem): void {
    this.navigateTab.emit(shortcut.id);
    void this.router.navigate([shortcut.route]);
  }

  protected toggleKpiDetail(type: KpiDetailType): void {
    if (this.selectedKpi() === type) {
      this.selectedKpi.set(null);
    } else {
      this.selectedKpi.set(type);
      this.kpiSearchQuery.set('');
    }
  }

  protected closeKpiDetail(): void {
    this.selectedKpi.set(null);
  }

  protected getFilteredOrders(): DashboardOrder[] {
    const q = this.kpiSearchQuery().toLowerCase().trim();
    const type = this.selectedKpi();
    let list = this.dynamicOrders();

    if (type === 'pending') {
      list = list.filter((o) => o.status === 'Pending Lab' || o.status === 'In Transit');
    }

    if (!q) return list;

    return list.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.phone.includes(q) ||
        o.status.toLowerCase().includes(q),
    );
  }

  protected getFilteredOffers() {
    const q = this.kpiSearchQuery().toLowerCase().trim();
    const offers = this.dynamicOffers();
    if (!q) return offers;
    return offers.filter(
      (off) =>
        off.code.toLowerCase().includes(q) ||
        off.title.toLowerCase().includes(q) ||
        off.discountText.toLowerCase().includes(q),
    );
  }

  protected getTotalRevenueValue(): number {
    return this.dynamicOrders().reduce((acc, o) => acc + o.paidAmount, 0);
  }

  protected getTotalOutstandingBalance(): number {
    return this.dynamicOrders().reduce(
      (acc, o) => acc + normalizeBalanceThreshold(o.totalAmount - o.paidAmount),
      0,
    );
  }

  protected getPendingOrdersCount(): number {
    return this.dynamicOrders().filter((o) => o.status === 'Pending Lab' || o.status === 'In Transit').length;
  }
}

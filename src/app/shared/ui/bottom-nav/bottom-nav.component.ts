import { Component, inject, input, output, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppConfigService } from '../../../services/app-config.service';
import { PosTab } from '../../models/pos-tab';
import { TranslatePipe } from '../../pipes/translate.pipe';

interface NavItem {
  tab: PosTab;
  i18nKey: string;
  ariaLabel: string;
  badge?: number;
}

@Component({
  selector: 'app-bottom-nav',
  imports: [TranslatePipe],
  templateUrl: './bottom-nav.component.html',
  styleUrl: './bottom-nav.component.css',
})
export class BottomNavComponent implements OnInit {
  readonly activeTab = input<PosTab>('sell');
  readonly tabChange = output<PosTab>();

  private readonly http = inject(HttpClient);
  private readonly appConfig = inject(AppConfigService);

  protected readonly items = signal<NavItem[]>([
    { tab: 'dashboard', i18nKey: 'nav.dashboard', ariaLabel: 'Dashboard' },
    { tab: 'sell', i18nKey: 'nav.sell', ariaLabel: 'Sell' },
    { tab: 'prescription', i18nKey: 'nav.order', ariaLabel: 'Order' },
    { tab: 'reports', i18nKey: 'nav.reports', ariaLabel: 'Reports' },
    { tab: 'insurance', i18nKey: 'nav.insurance', ariaLabel: 'Insurance' },
    { tab: 'deliveries', i18nKey: 'nav.deliveries', ariaLabel: 'Deliveries' },
    { tab: 'status', i18nKey: 'nav.orderStatus', ariaLabel: 'Order Status' }
  ]);

  ngOnInit(): void {
    this.fetchDeliveriesCount();
    
    // Fetch tenant feature access config
    const settings = this.appConfig.settings;
    const apiUrl = settings?.apiUrl?.replace(/\/$/, '') || 'https://localhost:7207/api';

    this.http.get<any>(`${apiUrl}/TenantAccess/default`).subscribe({
      next: (config) => {
        if (config) {
          const insurance = config.hasInsuranceAccess !== undefined ? config.hasInsuranceAccess : config.HasInsuranceAccess;
          if (insurance === false) {
            this.items.update(items => items.filter(item => item.tab !== 'insurance'));
          }
        }
      },
      error: (err) => console.error('Failed to load tenant access config', err)
    });
  }

  private fetchDeliveriesCount(): void {
    const storeId = '7'; // Fallback store id or take from store logic
    const settings = this.appConfig.settings;
    const apiUrl = settings?.apiUrl?.replace(/\/$/, '') || 'https://localhost:7207/api';

    this.http.get<{status: string, objresult: any[]}>(`${apiUrl}/sales/GetTodayDeliveries?storeId=${storeId}`)
      .subscribe({
        next: (res) => {
          if (res.status === '200' && res.objresult) {
            const pendingDeliveries = res.objresult.filter(delivery => {
              const balance = delivery.Balance || 0;
              const insurance = delivery.InsuranceAmount || 0;
              return Math.max(0, balance - insurance) > 0;
            });
            this.updateBadge('deliveries', pendingDeliveries.length);
          }
        },
        error: (err) => console.error('Failed to load deliveries count', err)
      });
  }

  private updateBadge(tab: PosTab, count: number): void {
    this.items.update(items => items.map(item => 
      item.tab === tab ? { ...item, badge: count } : item
    ));
  }

  protected isActive(tab: PosTab): boolean {
    return this.activeTab() === tab;
  }

  protected onTabClick(tab: PosTab): void {
    if (tab !== this.activeTab()) {
      this.tabChange.emit(tab);
    }
  }
}

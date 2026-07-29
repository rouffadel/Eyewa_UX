import { Component, inject, input, output, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppConfigService } from '../../../services/app-config.service';
import { PosTab } from '../../models/pos-tab';

interface NavItem {
  tab: PosTab;
  label: string;
  shortLabel?: string;
  ariaLabel: string;
  badge?: number;
}

@Component({
  selector: 'app-bottom-nav',
  templateUrl: './bottom-nav.component.html',
  styleUrl: './bottom-nav.component.css',
})
export class BottomNavComponent implements OnInit {
  readonly activeTab = input<PosTab>('sell');
  readonly tabChange = output<PosTab>();

  private readonly http = inject(HttpClient);
  private readonly appConfig = inject(AppConfigService);

  protected readonly items = signal<NavItem[]>([
    { tab: 'sell', label: 'Sell', ariaLabel: 'Sell' },
    {
      tab: 'prescription',
      label: 'Prescription',
      shortLabel: 'Rx',
      ariaLabel: 'Prescription',
    },
    {
      tab: 'reports',
      label: 'Reports',
      shortLabel: 'Reports',
      ariaLabel: 'Reports',
    },
    {
      tab: 'insurance',
      label: 'Insurance',
      shortLabel: 'Insurance',
      ariaLabel: 'Insurance',
    },
    {
      tab: 'deliveries',
      label: 'Deliveries',
      shortLabel: 'Deliv',
      ariaLabel: 'Deliveries',
    }
  ]);

  ngOnInit(): void {
    this.fetchDeliveriesCount();
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

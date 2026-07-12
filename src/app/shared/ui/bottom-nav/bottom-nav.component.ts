import { Component, input, output } from '@angular/core';
import { PosTab } from '../../models/pos-tab';

interface NavItem {
  tab: PosTab;
  label: string;
  shortLabel?: string;
  ariaLabel: string;
}

@Component({
  selector: 'app-bottom-nav',
  templateUrl: './bottom-nav.component.html',
  styleUrl: './bottom-nav.component.css',
})
export class BottomNavComponent {
  readonly activeTab = input<PosTab>('sell');
  readonly tabChange = output<PosTab>();

  protected readonly items: NavItem[] = [
    { tab: 'sell', label: 'Sell', ariaLabel: 'Sell' },
    {
      tab: 'prescription',
      label: 'Prescription',
      shortLabel: 'Rx',
      ariaLabel: 'Prescription',
    },
    {
      tab: 'measurements',
      label: 'Measurements',
      shortLabel: 'Measure',
      ariaLabel: 'Measurements',
    },
    {
      tab: 'delivery',
      label: 'Delivery / Order',
      shortLabel: 'Delivery',
      ariaLabel: 'Delivery and order',
    },
    { tab: 'more', label: 'More', ariaLabel: 'More' },
  ];

  protected isActive(tab: PosTab): boolean {
    return this.activeTab() === tab;
  }

  protected onTabClick(tab: PosTab): void {
    if (tab !== this.activeTab()) {
      this.tabChange.emit(tab);
    }
  }
}

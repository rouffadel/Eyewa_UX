import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { PosTab, posTabFromUrlSegment } from '../../../shared/models/pos-tab';
import { AppHeaderComponent } from '../../../shared/ui/app-header/app-header.component';
import { BottomNavComponent } from '../../../shared/ui/bottom-nav/bottom-nav.component';
import { Customer } from '../sell/models/customer.models';
import { SellSessionStore } from '../sell/services/sell-session.store';

@Component({
  selector: 'app-pos-shell',
  imports: [AppHeaderComponent, BottomNavComponent, RouterOutlet],
  template: `
    <div class="pos-shell">
      @if (!hideShellChrome()) {
        <app-header
          [notificationCount]="2"
          (notificationsClick)="onNotificationsClick()"
          (profileClick)="openProfile()"
          (customerSelected)="onCustomerSelected($event)"
          (newCustomer)="onNewCustomer()"
        />
      }

      <main
        class="pos-shell__content"
        [class.pos-shell__content--full]="hideShellChrome()"
      >
        <router-outlet />
      </main>

      @if (!hideShellChrome()) {
        <app-bottom-nav [activeTab]="activeTab()" (tabChange)="onTabChange($event)" />
      }
    </div>
  `,
  styleUrl: './pos-shell.component.css',
})
export class PosShellComponent {
  private readonly router = inject(Router);
  private readonly sellStore = inject(SellSessionStore);

  protected readonly activeTab = signal<PosTab>('sell');
  protected readonly hideShellChrome = signal(false);

  constructor() {
    this.syncFromUrl(this.router.url);

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => this.syncFromUrl(event.urlAfterRedirects));
  }

  protected onTabChange(tab: PosTab): void {
    void this.router.navigate(['/home', tab]);
  }

  protected openProfile(): void {
    void this.router.navigate(['/home/profile'], {
      queryParams: { returnTo: this.activeTab() },
    });
  }

  protected onCustomerSelected(customer: Customer): void {
    this.sellStore.selectCustomer(customer);
    this.sellStore.clearStatusMessages();

    if (this.activeTab() !== 'sell') {
      void this.router.navigate(['/home', 'sell']);
    }
  }

  protected onNewCustomer(): void {
    void this.router.navigate(['/home/createcustomer'], {
      queryParams: { returnTo: this.activeTab() },
    });
  }

  protected onNotificationsClick(): void {
    // Stub for notifications
  }

  private syncFromUrl(url: string): void {
    const path = url.split('?')[0];
    const segment = path.split('/').filter(Boolean).pop();

    this.hideShellChrome.set(segment === 'profile' || segment === 'createcustomer');

    if (segment === 'profile' || segment === 'createcustomer') {
      return;
    }

    if (path.includes('/home/prescription')) {
      this.activeTab.set('prescription');
      return;
    }

    const tab = posTabFromUrlSegment(segment);

    if (tab) {
      this.activeTab.set(tab);
    }
  }
}

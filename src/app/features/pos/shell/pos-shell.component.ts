import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterOutlet,
} from '@angular/router';
import { filter } from 'rxjs/operators';
import { PosTab, posTabFromUrlSegment } from '../../../shared/models/pos-tab';
import { AppHeaderComponent } from '../../../shared/ui/app-header/app-header.component';
import { BottomNavComponent } from '../../../shared/ui/bottom-nav/bottom-nav.component';
import { Customer } from '../sell/models/customer.models';
import { SellSessionStore } from '../sell/services/sell-session.store';

@Component({
  selector: 'app-pos-shell',
  standalone: true,
  imports: [AppHeaderComponent, BottomNavComponent, RouterOutlet],
  template: `
    <div class="pos-shell">
      @if (isPageLoading()) {
        <div class="pos-shell__progress-bar"></div>
      }

      @if (!hideShellChrome()) {
        <app-header
          [activeTab]="activeTab()"
          [notificationCount]="2"
          [overrideLoyaltyPoints]="sellStore.selectedCustomer()?.loyaltyPoints ?? null"
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
        @if (isPageLoading()) {
          <div class="pos-shell__loading-overlay" role="status" aria-label="Loading page data">
            <div class="pos-shell__loading-card">
              <div class="pos-shell__spinner"></div>
              <span class="pos-shell__loading-text">Loading Page...</span>
            </div>
          </div>
        }
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
  protected readonly sellStore = inject(SellSessionStore);

  protected readonly activeTab = signal<PosTab>('dashboard');
  protected readonly hideShellChrome = signal(false);
  protected readonly isPageLoading = signal<boolean>(false);

  constructor() {
    this.syncFromUrl(this.router.url);

    this.router.events
      .pipe(takeUntilDestroyed())
      .subscribe((event) => {
        if (event instanceof NavigationStart) {
          this.isPageLoading.set(true);
        } else if (
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError
        ) {
          this.syncFromUrl(event instanceof NavigationEnd ? event.urlAfterRedirects : this.router.url);
          setTimeout(() => {
            this.isPageLoading.set(false);
          }, 250);
        }
      });
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

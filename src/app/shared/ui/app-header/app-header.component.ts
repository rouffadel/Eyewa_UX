import {
  AfterViewInit,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { StoreOption } from '../../../features/auth/models/store.models';
import { AuthService } from '../../../features/auth/services/auth.service';
import { StoreService } from '../../../features/auth/services/store.service';
import { CustomerSearchService } from '../../../features/pos/customer/services/customer-search.service';
import { Customer } from '../../../features/pos/sell/models/customer.models';

@Component({
  selector: 'app-header',
  imports: [FormsModule],
  templateUrl: './app-header.component.html',
  styleUrl: './app-header.component.css',
})
export class AppHeaderComponent implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly authService = inject(AuthService);
  private readonly storeService = inject(StoreService);
  private readonly customerSearchService = inject(CustomerSearchService);
  private readonly searchSubject = new Subject<string>();
  private searchRequestId = 0;

  readonly notificationCount = input(0);

  readonly notificationsClick = output<void>();
  readonly profileClick = output<void>();
  readonly customerSelected = output<Customer>();
  readonly newCustomer = output<void>();
  readonly scanClick = output<void>();

  protected readonly searchQuery = signal('');
  protected readonly searchResults = signal<Customer[]>([]);
  protected readonly searchOpen = signal(false);
  protected readonly searchLoading = signal(false);
  protected readonly searchError = signal<string | null>(null);
  protected readonly storeMenuOpen = signal(false);
  protected readonly stores = signal<StoreOption[]>([]);
  protected readonly storesLoading = signal(false);
  protected readonly storesError = signal<string | null>(null);

  protected readonly userName = computed(() => {
    const user = this.authService.user();
    const session = this.authService.currentSession();
    const name = user?.loginName ?? session?.displayName ?? 'User';
    return this.formatDisplayName(name);
  });

  protected readonly userBranch = computed(() => {
    const selectedStore = this.authService.selectedStore();
    if (selectedStore?.storeName) {
      return selectedStore.storeName;
    }

    const session = this.authService.currentSession();
    if (session?.branchName) {
      return session.branchName;
    }

    const storeId = this.authService.user()?.storeId;
    return storeId != null && storeId > 0 ? `Store ${storeId}` : 'Select store';
  });

  readonly overrideLoyaltyPoints = input<number | null>(null);

  protected readonly loyaltyPoints = computed(() => {
    const override = this.overrideLoyaltyPoints();
    if (override !== null) {
      return override;
    }
    return this.authService.currentSession()?.loyaltyPoints ?? 0;
  });

  protected readonly userInitials = computed(() => {
    const name = this.userName();
    const parts = name.trim().split(/\s+/).filter(Boolean);

    if (parts.length === 0) {
      return 'U';
    }

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  });

  constructor() {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((query) => {
        void this.runCustomerSearch(query);
      });

    effect(() => {
      const loginId = this.authService.user()?.loginId;
      if (loginId != null) {
        untracked(() => {
          void this.loadStores();
        });
      }
    });
  }

  ngAfterViewInit(): void {
    const bar = this.host.nativeElement.querySelector('.app-header__bar');
    if (!(bar instanceof HTMLElement)) {
      return;
    }

    const root = document.documentElement;

    const syncHeaderHeight = () => {
      root.style.setProperty(
        '--header-height-total',
        `${Math.ceil(bar.getBoundingClientRect().height)}px`,
      );
    };

    syncHeaderHeight();

    const observer = new ResizeObserver(() => syncHeaderHeight());
    observer.observe(bar);
    this.destroyRef.onDestroy(() => observer.disconnect());

    const remeasureAfterOrientation = () => {
      root.style.removeProperty('--header-height-total');
      window.setTimeout(syncHeaderHeight, 50);
      window.setTimeout(syncHeaderHeight, 350);
      window.setTimeout(syncHeaderHeight, 700);
    };

    window.addEventListener('orientationchange', remeasureAfterOrientation);
    this.destroyRef.onDestroy(() => {
      window.removeEventListener('orientationchange', remeasureAfterOrientation);
    });
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target) {
      return;
    }

    if (this.storeMenuOpen() && !target.closest('.app-header__profile-menu')) {
      this.storeMenuOpen.set(false);
    }

    if (this.searchOpen() && !target.closest('.app-header__search-wrap')) {
      this.closeSearchDropdown();
    }
  }

  protected onSearchInput(value: string): void {
    this.searchQuery.set(value);
    this.searchSubject.next(value);
  }

  protected onSearchFocus(): void {
    if (this.searchResults().length > 0 || this.searchError() || this.searchLoading()) {
      this.searchOpen.set(true);
    }
  }

  protected onCustomerResultSelect(customer: Customer): void {
    this.customerSelected.emit(customer);
    this.searchQuery.set('');
    this.closeSearchDropdown();
    this.searchRequestId += 1;
  }

  protected onNotificationsClick(): void {
    this.notificationsClick.emit();
  }

  protected onAvatarClick(): void {
    this.profileClick.emit();
  }

  protected onProfileMenuToggle(): void {
    const willOpen = !this.storeMenuOpen();
    this.storeMenuOpen.set(willOpen);

    if (willOpen) {
      void this.loadStores();
    }
  }

  protected onStoreSelect(store: StoreOption): void {
    this.authService.selectStore(store);
    this.storeMenuOpen.set(false);
  }

  protected isStoreSelected(store: StoreOption): boolean {
    const selected = this.authService.selectedStore();
    if (selected) {
      return selected.storeId === store.storeId;
    }

    const userStoreId = this.authService.user()?.storeId;
    return userStoreId != null && userStoreId > 0 && userStoreId === store.storeId;
  }

  protected onNewCustomer(): void {
    this.newCustomer.emit();
  }

  protected onScanClick(): void {
    this.scanClick.emit();
  }

  private closeSearchDropdown(): void {
    this.searchOpen.set(false);
    this.searchResults.set([]);
    this.searchError.set(null);
    this.searchLoading.set(false);
  }

  private async runCustomerSearch(rawQuery: string): Promise<void> {
    const query = rawQuery.trim();

    if (!query) {
      this.searchRequestId += 1;
      this.closeSearchDropdown();
      return;
    }

    const requestId = ++this.searchRequestId;
    this.searchLoading.set(true);
    this.searchError.set(null);
    this.searchOpen.set(true);

    try {
      const results = await this.customerSearchService.search(rawQuery);

      if (requestId !== this.searchRequestId) {
        return;
      }

      this.searchResults.set(results);
      this.searchError.set(results.length === 0 ? 'No customers found.' : null);
    } catch (error) {
      if (requestId !== this.searchRequestId) {
        return;
      }

      const message = error instanceof Error ? error.message : 'Unable to search customers.';
      this.searchResults.set([]);
      this.searchError.set(message);
    } finally {
      if (requestId === this.searchRequestId) {
        this.searchLoading.set(false);
      }
    }
  }

  private async loadStores(): Promise<void> {
    if (this.stores().length > 0 || this.storesLoading()) {
      return;
    }

    const loginId = this.authService.user()?.loginId;
    if (loginId == null) {
      this.storesError.set('Unable to load stores.');
      return;
    }

    this.storesLoading.set(true);
    this.storesError.set(null);

    try {
      const stores = await this.storeService.fillStores(loginId, 0);
      this.stores.set(stores);
      this.ensureSelectedStore(stores);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load stores.';
      this.storesError.set(message);
    } finally {
      this.storesLoading.set(false);
    }
  }

  private ensureSelectedStore(stores: StoreOption[]): void {
    if (stores.length === 0) {
      return;
    }

    const current = this.authService.selectedStore();
    if (current && stores.some((store) => store.storeId === current.storeId)) {
      return;
    }

    const preferred =
      stores.find((store) => store.isDefault) ??
      stores[0];

    this.authService.selectStore(preferred);
  }

  private formatDisplayName(name: string): string {
    const trimmed = name.trim();
    if (!trimmed) {
      return 'User';
    }

    return trimmed
      .split(/\s+/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }
}

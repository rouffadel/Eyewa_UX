import { AfterViewInit, Component, computed, ElementRef, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { posTabFromUrlSegment } from '../../../shared/models/pos-tab';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.css',
})
export class ProfilePageComponent implements AfterViewInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly host = inject(ElementRef<HTMLElement>);

  protected readonly displayName = computed(
    () => this.authService.user()?.loginName ?? this.authService.currentSession()?.displayName ?? 'User',
  );

  protected readonly branchName = computed(() => {
    const selectedStore = this.authService.selectedStore();
    if (selectedStore?.storeName) {
      return selectedStore.storeName;
    }

    const session = this.authService.currentSession();
    if (session?.branchName) {
      return session.branchName;
    }

    const storeId = this.authService.user()?.storeId;
    return storeId != null ? `Store ${storeId}` : 'Main Branch';
  });

  protected readonly roleId = computed(() => this.authService.user()?.roleId ?? null);

  protected readonly loginId = computed(() => this.authService.user()?.loginId ?? null);

  protected readonly loyaltyPoints = computed(
    () => this.authService.currentSession()?.loyaltyPoints ?? 250,
  );

  protected readonly userInitials = computed(() => {
    const name = this.displayName();
    const parts = name.trim().split(/\s+/).filter(Boolean);

    if (parts.length === 0) {
      return 'U';
    }

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  });

  ngAfterViewInit(): void {
    const page = this.host.nativeElement.querySelector('.profile-page');
    if (page instanceof HTMLElement) {
      page.scrollTop = 0;
    }

    const shell = this.host.nativeElement.closest('.pos-shell__content');
    if (shell instanceof HTMLElement) {
      shell.scrollTop = 0;
    }
  }

  protected goBack(): void {
    const returnTo = this.route.snapshot.queryParamMap.get('returnTo') ?? undefined;
    const tab = posTabFromUrlSegment(returnTo) ?? 'sell';
    void this.router.navigate(['/home', tab]);
  }

  protected logout(): void {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }
}

import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DisplayOffer {
  offerId?: number;
  offerCode: string;
  offerName: string;
  offerType: string;
  discountType?: string;
  discountValue?: number;
  description?: string;
  badgeText?: string;
  theme?: 'emerald' | 'crimson' | 'royal' | 'amber';
}

@Component({
  selector: 'app-offers-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './offers-banner.component.html',
  styleUrl: './offers-banner.component.css',
})
export class OffersBannerComponent implements OnInit, OnDestroy {
  @Input() offers: any[] = [];
  @Input() selectedCoupon: any | null = null;
  @Input() isOpen: boolean = true;

  @Output() applyOffer = new EventEmitter<any>();
  @Output() removeOffer = new EventEmitter<void>();
  @Output() closeBanner = new EventEmitter<void>();
  @Output() toggleBanner = new EventEmitter<void>();

  readonly activeIndex = signal(0);
  readonly isPaused = signal(false);

  private timerId: any = null;

  // Fallback demo offers if no active offers from backend
  private readonly defaultOffers: DisplayOffer[] = [
    {
      offerCode: 'B1G1',
      offerName: 'Buy 1 Get 1 Free Eyewear',
      offerType: 'BuyXGetY',
      badgeText: '⚡ BOGO SPECIAL',
      description: 'Buy any prescription frame and get 1 free reward item in cart!',
      theme: 'crimson',
    },
    {
      offerCode: 'off20',
      offerName: '25% OFF Weekend Discount',
      offerType: 'Discount',
      discountType: 'Percentage',
      discountValue: 25,
      badgeText: '🔥 25% OFF',
      description: 'Instant 25% discount applied on eligible cart items.',
      theme: 'emerald',
    },
    {
      offerCode: 'EYE50',
      offerName: '50 SAR Flat Savings',
      offerType: 'Discount',
      discountType: 'Fixed',
      discountValue: 50,
      badgeText: '🏷️ FLAT 50 SAR OFF',
      description: 'Save 50 SAR on sunglasses and frame collections.',
      theme: 'royal',
    },
  ];

  readonly displayOffers = computed<DisplayOffer[]>(() => {
    if (this.offers && this.offers.length > 0) {
      return this.offers.map((offer) => {
        let badgeText = '🔥 RUNNING OFFER';
        let theme: 'emerald' | 'crimson' | 'royal' | 'amber' = 'emerald';

        if (offer.offerType === 'BuyXGetY') {
          badgeText = '⚡ BOGO SPECIAL';
          theme = 'crimson';
        } else if (offer.discountType === 'Percentage') {
          badgeText = `🔥 ${offer.discountValue}% OFF`;
          theme = 'emerald';
        } else {
          badgeText = `🏷️ ${offer.discountValue} SAR OFF`;
          theme = 'royal';
        }

        return {
          ...offer,
          badgeText,
          theme,
          description: offer.description || `Special promotion code: ${offer.offerCode}`,
        };
      });
    }
    return this.defaultOffers;
  });

  constructor() {
    effect(() => {
      const list = this.displayOffers();
      if (this.activeIndex() >= list.length) {
        this.activeIndex.set(0);
      }
    });
  }

  ngOnInit(): void {
    this.startAutoSlide();
  }

  ngOnDestroy(): void {
    this.stopAutoSlide();
  }

  private startAutoSlide(): void {
    this.stopAutoSlide();
    this.timerId = setInterval(() => {
      if (!this.isPaused() && this.isOpen) {
        this.nextSlide();
      }
    }, 4000);
  }

  private stopAutoSlide(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  nextSlide(): void {
    const total = this.displayOffers().length;
    if (total <= 1) return;
    this.activeIndex.update((idx) => (idx + 1) % total);
  }

  prevSlide(): void {
    const total = this.displayOffers().length;
    if (total <= 1) return;
    this.activeIndex.update((idx) => (idx - 1 + total) % total);
  }

  goToSlide(index: number): void {
    this.activeIndex.set(index);
  }

  onMouseEnter(): void {
    this.isPaused.set(true);
  }

  onMouseLeave(): void {
    this.isPaused.set(false);
  }

  isApplied(offer: DisplayOffer): boolean {
    if (!this.selectedCoupon) return false;
    return this.selectedCoupon.offerCode === offer.offerCode;
  }

  toggleApply(offer: DisplayOffer, event: Event): void {
    event.stopPropagation();
    if (this.isApplied(offer)) {
      this.removeOffer.emit();
    } else {
      this.applyOffer.emit(offer);
    }
  }

  onClose(event: Event): void {
    event.stopPropagation();
    this.closeBanner.emit();
  }

  onToggleTrigger(event: Event): void {
    event.stopPropagation();
    this.toggleBanner.emit();
  }
}

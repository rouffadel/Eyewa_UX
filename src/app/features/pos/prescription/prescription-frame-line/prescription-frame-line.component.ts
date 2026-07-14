import {
  Component,
  computed,
  DestroyRef,
  HostListener,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { BrandOption } from '../../sell/models/brand.models';
import { CategoryOption } from '../../sell/models/category.models';
import { ProductOption } from '../../sell/models/product.models';
import { BrandService } from '../../sell/services/brand.service';
import { ProductService } from '../../sell/services/product.service';
import { formatMoney } from '../../sell/services/payment.service';
import {
  calculateFrameLineTotals,
  FRAME_CATEGORIES,
  parseNumericInput,
  PrescriptionFrameLineTotals,
} from '../models/prescription.models';

export type PrescriptionFramesTemplate = 'guided' | 'productSearch';

@Component({
  selector: 'app-prescription-frame-line',
  imports: [ReactiveFormsModule],
  templateUrl: './prescription-frame-line.component.html',
  styleUrl: './prescription-frame-line.component.css',
})
export class PrescriptionFrameLineComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly brandService = inject(BrandService);
  private readonly productService = inject(ProductService);
  private readonly brandSearchSubject = new Subject<string>();
  private readonly modelSearchSubject = new Subject<string>();
  private brandSearchRequestId = 0;
  private modelSearchRequestId = 0;

  readonly group = input.required<FormGroup>();
  readonly index = input(0);
  readonly canRemove = input(true);
  readonly storeId = input<number | null>(null);
  readonly framesTemplate = input<PrescriptionFramesTemplate>('guided');

  readonly remove = output<void>();

  readonly categories = input<readonly string[]>(FRAME_CATEGORIES);
  readonly categoryOptions = input<readonly CategoryOption[]>([]);
  protected readonly formatMoney = formatMoney;
  protected readonly isProductSearchMode = computed(
    () => this.framesTemplate() === 'productSearch',
  );
  protected readonly brandResults = signal<BrandOption[]>([]);
  protected readonly brandSearchOpen = signal(false);
  protected readonly brandSearchLoading = signal(false);
  protected readonly brandSearchError = signal<string | null>(null);
  protected readonly modelResults = signal<ProductOption[]>([]);
  protected readonly modelSearchOpen = signal(false);
  protected readonly modelSearchLoading = signal(false);
  protected readonly modelSearchError = signal<string | null>(null);
  /** UI-only; not part of the save model. */
  protected readonly salePrice = signal<number | null>(null);

  constructor() {
    this.brandSearchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((query) => {
        void this.runBrandSearch(query);
      });

    this.modelSearchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((query) => {
        void this.runModelSearch(query);
      });
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target) {
      return;
    }

    if (this.brandSearchOpen() && !target.closest('.frame-line__brand-wrap')) {
      this.closeBrandSearch();
    }

    if (this.modelSearchOpen() && !target.closest('.frame-line__model-wrap')) {
      this.closeModelSearch();
    }
  }

  protected onBrandInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.group().get('brandId')?.setValue(null);
    this.group().get('productId')?.setValue(null);
    this.brandSearchSubject.next(value);
  }

  protected onBrandFocus(): void {
    if (this.brandResults().length > 0 || this.brandSearchError() || this.brandSearchLoading()) {
      this.brandSearchOpen.set(true);
    }
  }

  protected onCategoryChange(): void {
    const category = String(this.group().get('category')?.value ?? '');
    this.group().patchValue({
      categoryId: this.resolveCategoryId(category),
      productId: null,
      modelNo: '',
      maxDiscount: null,
    });
    this.group().get('discountPercent')?.updateValueAndValidity();
    this.closeModelSearch();
    this.modelSearchRequestId += 1;
  }

  protected onBrandSelect(brand: BrandOption): void {
    this.group().patchValue({
      brandId: brand.brandId,
      brandName: brand.brandName,
      productId: null,
      modelNo: '',
      maxDiscount: null,
    });
    this.group().get('discountPercent')?.updateValueAndValidity();
    this.closeBrandSearch();
    this.brandSearchRequestId += 1;
    this.closeModelSearch();
    this.modelSearchRequestId += 1;
  }

  protected onModelInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;

    if (this.isProductSearchMode()) {
      this.group().patchValue({
        productId: null,
        categoryId: null,
        category: '',
        brandId: null,
        brandName: '',
        sellingPrice: null,
        maxDiscount: null,
        discountPercent: null,
      });
      this.salePrice.set(null);
    } else {
      this.group().patchValue({ productId: null, maxDiscount: null });
      this.group().get('discountPercent')?.updateValueAndValidity();
    }

    this.modelSearchSubject.next(value);
  }

  protected onModelFocus(): void {
    if (this.modelResults().length > 0 || this.modelSearchError() || this.modelSearchLoading()) {
      this.modelSearchOpen.set(true);
    }
  }

  protected onModelSelect(product: ProductOption): void {
    const sellingPrice = parseNumericInput(product.productValue);
    const maxDiscount = parseNumericInput(product.maxDiscount);

    if (this.isProductSearchMode()) {
      const matchedCategory = this.resolveCategoryById(product.categoryId);

      this.group().patchValue({
        productId: product.productId,
        modelNo: product.productName,
        sellingPrice,
        maxDiscount,
        categoryId: matchedCategory?.categoryId ?? product.categoryId,
        category: matchedCategory?.categoryName ?? '',
        brandId: product.brandId,
        brandName: product.brandName,
        discountPercent: 0,
      });
      this.salePrice.set(sellingPrice);
    } else {
      this.group().patchValue({
        productId: product.productId,
        modelNo: product.productName,
        sellingPrice,
        maxDiscount,
        categoryId: product.categoryId,
      });
    }

    this.group().get('sellingPrice')?.updateValueAndValidity();
    this.group().get('discountPercent')?.updateValueAndValidity();
    this.closeModelSearch();
    this.modelSearchRequestId += 1;
  }

  protected onSalePriceInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const sale = parseNumericInput(raw);
    this.salePrice.set(sale);
    this.applySalePriceDiscount(sale);
  }

  protected maxDiscountCap(): number | null {
    return parseNumericInput(this.group().get('maxDiscount')?.value);
  }

  protected discountInputMax(): number {
    return this.maxDiscountCap() ?? 100;
  }

  protected totalsFor(group: FormGroup): PrescriptionFrameLineTotals {
    const value = group.getRawValue() as {
      sellingPrice: number | null;
      quantity: number;
      discountPercent: number | null;
    };

    return calculateFrameLineTotals(value.sellingPrice, value.quantity, value.discountPercent);
  }

  private applySalePriceDiscount(sale: number | null): void {
    const sellingPrice = parseNumericInput(this.group().get('sellingPrice')?.value);

    if (sellingPrice == null || sellingPrice <= 0 || sale == null) {
      this.group().patchValue({ discountPercent: null });
      this.group().get('discountPercent')?.updateValueAndValidity();
      return;
    }

    const clampedSale = Math.min(Math.max(0, sale), sellingPrice);
    if (clampedSale !== sale) {
      this.salePrice.set(clampedSale);
    }

    const discountPercent = Number(
      (((sellingPrice - clampedSale) / sellingPrice) * 100).toFixed(2),
    );

    this.group().patchValue({ discountPercent });
    this.group().get('discountPercent')?.updateValueAndValidity();
  }

  private closeBrandSearch(): void {
    this.brandSearchOpen.set(false);
    this.brandResults.set([]);
    this.brandSearchError.set(null);
    this.brandSearchLoading.set(false);
  }

  private closeModelSearch(): void {
    this.modelSearchOpen.set(false);
    this.modelResults.set([]);
    this.modelSearchError.set(null);
    this.modelSearchLoading.set(false);
  }

  private resolveCategoryId(categoryName: string): number | null {
    const match = this.categoryOptions().find((category) => category.categoryName === categoryName);
    return match?.categoryId ?? null;
  }

  private resolveCategoryById(categoryId: number | null | undefined): CategoryOption | null {
    if (categoryId == null) {
      return null;
    }

    return this.categoryOptions().find((category) => category.categoryId === categoryId) ?? null;
  }

  private async runBrandSearch(rawQuery: string): Promise<void> {
    const query = rawQuery.trim();

    if (!query) {
      this.brandSearchRequestId += 1;
      this.closeBrandSearch();
      return;
    }

    const requestId = ++this.brandSearchRequestId;
    this.brandSearchLoading.set(true);
    this.brandSearchError.set(null);
    this.brandSearchOpen.set(true);

    try {
      const results = await this.brandService.getBrands(query);

      if (requestId !== this.brandSearchRequestId) {
        return;
      }

      this.brandResults.set(results);
      this.brandSearchError.set(results.length === 0 ? 'No brands found.' : null);
    } catch (error) {
      if (requestId !== this.brandSearchRequestId) {
        return;
      }

      const message = error instanceof Error ? error.message : 'Unable to search brands.';
      this.brandResults.set([]);
      this.brandSearchError.set(message);
    } finally {
      if (requestId === this.brandSearchRequestId) {
        this.brandSearchLoading.set(false);
      }
    }
  }

  private async runModelSearch(rawQuery: string): Promise<void> {
    if (this.isProductSearchMode()) {
      await this.runProductSearchByKey(rawQuery);
      return;
    }

    await this.runGuidedModelSearch(rawQuery);
  }

  private async runProductSearchByKey(rawQuery: string): Promise<void> {
    const query = rawQuery.trim();

    if (!query) {
      this.modelSearchRequestId += 1;
      this.closeModelSearch();
      return;
    }

    const requestId = ++this.modelSearchRequestId;
    this.modelSearchLoading.set(true);
    this.modelSearchError.set(null);
    this.modelSearchOpen.set(true);

    try {
      const results = await this.productService.searchProductsByKey(query);

      if (requestId !== this.modelSearchRequestId) {
        return;
      }

      this.modelResults.set(results);
      this.modelSearchError.set(results.length === 0 ? 'No models found.' : null);
    } catch (error) {
      if (requestId !== this.modelSearchRequestId) {
        return;
      }

      const message = error instanceof Error ? error.message : 'Unable to search models.';
      this.modelResults.set([]);
      this.modelSearchError.set(message);
    } finally {
      if (requestId === this.modelSearchRequestId) {
        this.modelSearchLoading.set(false);
      }
    }
  }

  private async runGuidedModelSearch(rawQuery: string): Promise<void> {
    const query = rawQuery.trim();

    if (!query) {
      this.modelSearchRequestId += 1;
      this.closeModelSearch();
      return;
    }

    const categoryId = this.resolveCategoryId(String(this.group().get('category')?.value ?? ''));
    const brandId = this.group().get('brandId')?.value as number | null;
    const storeId = this.storeId();

    if (!categoryId || !brandId) {
      this.modelSearchRequestId += 1;
      this.modelSearchOpen.set(true);
      this.modelSearchLoading.set(false);
      this.modelResults.set([]);
      this.modelSearchError.set('Select category and brand before searching models.');
      return;
    }

    if (!storeId) {
      this.modelSearchRequestId += 1;
      this.modelSearchOpen.set(true);
      this.modelSearchLoading.set(false);
      this.modelResults.set([]);
      this.modelSearchError.set('Select a store before searching models.');
      return;
    }

    const requestId = ++this.modelSearchRequestId;
    this.modelSearchLoading.set(true);
    this.modelSearchError.set(null);
    this.modelSearchOpen.set(true);

    try {
      const results = await this.productService.searchProducts({
        categoryId,
        brandId,
        storeId,
        productName: query,
      });

      if (requestId !== this.modelSearchRequestId) {
        return;
      }

      this.modelResults.set(results);
      this.modelSearchError.set(results.length === 0 ? 'No models found.' : null);
    } catch (error) {
      if (requestId !== this.modelSearchRequestId) {
        return;
      }

      const message = error instanceof Error ? error.message : 'Unable to search models.';
      this.modelResults.set([]);
      this.modelSearchError.set(message);
    } finally {
      if (requestId === this.modelSearchRequestId) {
        this.modelSearchLoading.set(false);
      }
    }
  }
}

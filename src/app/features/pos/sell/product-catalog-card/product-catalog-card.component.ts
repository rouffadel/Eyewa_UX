import { Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CatalogCategory, CATALOG_TABS, Product } from '../models/product.models';

@Component({
  selector: 'app-product-catalog-card',
  imports: [FormsModule],
  templateUrl: './product-catalog-card.component.html',
  styleUrl: './product-catalog-card.component.css',
  host: { class: 'product-catalog-card-host' },
})
export class ProductCatalogCardComponent {
  readonly category = input<CatalogCategory>('frames');
  readonly products = input<Product[]>([]);
  readonly search = input('');
  readonly locked = input(false);

  readonly categoryChange = output<CatalogCategory>();
  readonly searchChange = output<string>();
  readonly productSelect = output<Product>();
  readonly scanClick = output<void>();
  readonly filterClick = output<void>();

  protected readonly tabs = CATALOG_TABS;

  protected readonly searchPlaceholder = computed(() => {
    const labels: Record<CatalogCategory, string> = {
      frames: 'Search frames…',
      lenses: 'Search lenses…',
      accessories: 'Search accessories…',
      'contact-lens': 'Search contact lens…',
    };

    return labels[this.category()];
  });

  protected onSearchInput(value: string): void {
    this.searchChange.emit(value);
  }

  protected onScanClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.scanClick.emit();
  }
}

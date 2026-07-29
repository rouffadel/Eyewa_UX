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
  readonly locked = input(false);

  readonly categoryChange = output<CatalogCategory>();
  readonly productSelect = output<Product>();

  protected readonly tabs = CATALOG_TABS;
}

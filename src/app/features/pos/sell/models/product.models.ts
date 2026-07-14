export type CatalogCategory = 'frames' | 'lenses' | 'accessories' | 'contact-lens';

export interface Product {
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  price: number;
  category: CatalogCategory;
}

export const CATALOG_TABS: { key: CatalogCategory; label: string }[] = [
  { key: 'frames', label: 'Frames' },
  { key: 'lenses', label: 'Lenses' },
  { key: 'accessories', label: 'Accessories' },
  { key: 'contact-lens', label: 'Contact Lens' },
];

export interface ProductOption {
  productId: number;
  productName: string;
  productValue: number;
  maxDiscount: number | null;
  categoryId: number;
  categoryName?: string;
  brandId: number;
  brandName: string;
}

export interface GetProductRow {
  productID?: number;
  ProductID?: number;
  productName?: string;
  ProductName?: string;
  productValue?: number;
  ProductValue?: number;
  maxDiscount?: number;
  MaxDiscount?: number;
  categoryID?: number;
  CategoryID?: number;
  categoryName?: string;
  CategoryName?: string;
  brandID?: number;
  BrandID?: number;
  brandName?: string;
  BrandName?: string;
}

export interface GetProductResponse {
  status: string;
  message: string;
  objresult?: GetProductRow[] | { table?: GetProductRow[] };
  qrcodeimg?: string | null;
}

export interface ProductSearchParams {
  categoryId: number;
  brandId: number;
  storeId: number;
  productName: string;
}

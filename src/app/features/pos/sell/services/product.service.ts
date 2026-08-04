import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { AppConfigService } from '../../../../services/app-config.service';
import {
  GetProductResponse,
  GetProductRow,
  ProductOption,
  ProductSearchParams,
} from '../models/product.models';

@Injectable({ providedIn: 'root' })
export class ProductService {
  constructor(
    private readonly http: HttpClient,
    private readonly appConfig: AppConfigService,
  ) {}

  searchProducts(params: ProductSearchParams): Promise<ProductOption[]> {
    const url = this.buildUrl(params);

    return firstValueFrom(this.http.get<GetProductResponse>(url))
      .then((response) => this.mapResponse(response))
      .catch((error: unknown) => {
        throw this.toError(error);
      });
  }

  searchProductsByKey(productName: string, storeId?: number | null): Promise<ProductOption[]> {
    const url = this.buildSearchByKeyUrl(productName, storeId);

    return firstValueFrom(this.http.post<GetProductResponse>(url, {}))
      .then((response) => this.mapResponse(response))
      .catch((error: unknown) => {
        throw this.toError(error);
      });
  }

  private buildUrl(params: ProductSearchParams): string {
    const settings = this.appConfig.settings;
    const apiUrl = settings?.apiUrl?.replace(/\/$/, '');
    const getProductPath = settings?.getProductPath ?? 'products/GetProduct';

    if (!apiUrl) {
      throw new Error('Product lookup is not configured.');
    }

    const query = new URLSearchParams({
      CategoryId: String(params.categoryId),
      BrandId: String(params.brandId),
      StoreId: String(params.storeId),
      ProductName: params.productName.trim(),
    });

    return `${apiUrl}/${getProductPath}?${query.toString()}`;
  }

  private buildSearchByKeyUrl(productName: string, storeId?: number | null): string {
    const settings = this.appConfig.settings;
    const apiUrl = settings?.apiUrl?.replace(/\/$/, '');
    const searchPath = settings?.searchProductByKeyPath ?? 'products/SearchProductByKey';

    if (!apiUrl) {
      throw new Error('Product lookup is not configured.');
    }

    const queryParams: Record<string, string> = {
      ProductName: productName.trim(),
    };
    
    if (storeId != null) {
      queryParams['StoreId'] = String(storeId);
    }

    const query = new URLSearchParams(queryParams);

    return `${apiUrl}/${searchPath}?${query.toString()}`;
  }


private buildGetAllProductsByStoreIdUrl(storeId: number): string {
  const settings = this.appConfig.settings;
  const apiUrl = settings?.apiUrl?.replace(/\/$/, '');
  const productsPath =
    settings?.getAllProductsByStoreIdPath ??
    'products/GetAllProductsByStoreId';

  if (!apiUrl) {
    throw new Error('Products API is not configured.');
  }

  const query = new URLSearchParams({
    StoreId: String(storeId),
  });

  return `${apiUrl}/${productsPath}?${query.toString()}`;
}

  getAllProductsByStoreId(storeId: any): Promise<ProductOption[]> {
    const url = this.buildGetAllProductsByStoreIdUrl(storeId);

    return firstValueFrom(this.http.get<GetProductResponse>(url))
      .then((response) => this.mapResponse(response))
      .catch((error: unknown) => {
        throw this.toError(error);
      });
  }


  private mapResponse(response: GetProductResponse): ProductOption[] {
    const rows = this.extractRows(response?.objresult);

    return rows
      .map((row) => this.toProductOption(row))
      .filter((option): option is ProductOption => option !== null);
  }

  private extractRows(objresult: GetProductResponse['objresult'] | undefined): GetProductRow[] {
    if (!objresult) {
      return [];
    }

    if (Array.isArray(objresult)) {
      return objresult;
    }

    return objresult.table ?? [];
  }

  private toProductOption(row: GetProductRow): ProductOption | null {
    const productId = row.productID ?? row.ProductID;
    const productName = row.productName ?? row.ProductName;
    const productValue = this.parseNumber(row.productValue ?? row.ProductValue);
    const categoryId = row.categoryID ?? row.CategoryID;
    const categoryName = (row.categoryName ?? row.CategoryName)?.trim();
    const brandId = row.brandID ?? row.BrandID;
    const brandName = row.brandName ?? row.BrandName;
    const maxDiscount = this.parseNumber(row.maxDiscount ?? row.MaxDiscount);
    const photoPath = row.photoPath ?? row.PhotoPath;

    if (productId == null || !productName?.trim() || productValue == null) {
      return null;
    }

    if (categoryId == null || brandId == null || !brandName?.trim()) {
      return null;
    }

    return {
      productId,
      productName: productName.trim(),
      productValue,
      maxDiscount: maxDiscount ?? null,
      categoryId,
      ...(categoryName ? { categoryName } : {}),
      brandId,
      brandName: brandName.trim(),
      ...(photoPath ? { photoPath } : {}),
    };
  }

  private parseNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value));
    return Number.isFinite(parsed) ? parsed : null;
  }

  private toError(error: unknown): Error {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return new Error('Unable to reach the server. Check your connection and try again.');
      }

      return new Error('Unable to load products. Please try again.');
    }

    if (error instanceof Error) {
      return error;
    }

    return new Error('Unable to load products. Please try again.');
  }
}

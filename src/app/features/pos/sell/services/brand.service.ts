import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppConfigService } from '../../../../services/app-config.service';
import { BrandOption, GetBrandResponse, GetBrandRow } from '../models/brand.models';

@Injectable({ providedIn: 'root' })
export class BrandService {
  constructor(
    private readonly http: HttpClient,
    private readonly appConfig: AppConfigService,
  ) {}

  getBrands(brandName: string): Promise<BrandOption[]> {
    const url = this.buildUrl(brandName);

    return firstValueFrom(this.http.get<GetBrandResponse>(url))
      .then((response) => this.mapResponse(response))
      .catch((error: unknown) => {
        throw this.toError(error);
      });
  }

  private buildUrl(brandName: string): string {
    const settings = this.appConfig.settings;
    const apiUrl = settings?.apiUrl?.replace(/\/$/, '');
    const getBrandPath = settings?.getBrandPath ?? 'products/GetBrand';

    if (!apiUrl) {
      throw new Error('Brand lookup is not configured.');
    }

    const params = new URLSearchParams({
      BrandName: brandName.trim(),
    });

    return `${apiUrl}/${getBrandPath}?${params.toString()}`;
  }

  private mapResponse(response: GetBrandResponse): BrandOption[] {
    const rows = this.extractRows(response?.objresult);

    return rows
      .map((row) => this.toBrandOption(row))
      .filter((option): option is BrandOption => option !== null);
  }

  private extractRows(
    objresult: GetBrandResponse['objresult'] | undefined,
  ): GetBrandRow[] {
    if (!objresult) {
      return [];
    }

    if (Array.isArray(objresult)) {
      return objresult;
    }

    return objresult.table ?? [];
  }

  private toBrandOption(row: GetBrandRow): BrandOption | null {
    const brandId = row.brandID ?? row.BrandID;
    const brandName = row.brandName ?? row.BrandName;

    if (brandId == null || !brandName?.trim()) {
      return null;
    }

    return {
      brandId,
      brandName: brandName.trim(),
    };
  }

  private toError(error: unknown): Error {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return new Error('Unable to reach the server. Check your connection and try again.');
      }

      return new Error('Unable to load brands. Please try again.');
    }

    if (error instanceof Error) {
      return error;
    }

    return new Error('Unable to load brands. Please try again.');
  }
}

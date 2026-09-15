import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppConfigService } from '../../../services/app-config.service';
import { FillStoreResponse, FillStoreRow, StoreOption } from '../models/store.models';

@Injectable({ providedIn: 'root' })
export class StoreService {
  constructor(
    private readonly http: HttpClient,
    private readonly appConfig: AppConfigService,
  ) {}

  fillStores(loginId: number, storeId = 0): Promise<StoreOption[]> {
    const url = this.buildUrl(loginId, storeId);

    return firstValueFrom(this.http.get<FillStoreResponse>(url))
      .then((response) => this.mapResponse(response))
      .catch((error: unknown) => {
        throw this.toError(error);
      });
  }

  private buildUrl(loginId: number, storeId: number): string {
    const settings = this.appConfig.settings;
    const apiUrl = settings?.apiUrl?.replace(/\/$/, '');
    const storesPath = settings?.storesPath ?? 'admin/FillStore';

    if (!apiUrl) {
      throw new Error('Store list is not configured.');
    }

    const params = new URLSearchParams({
      LoginId: String(loginId),
      StoreId: String(storeId),
    });

    return `${apiUrl}/${storesPath}?${params.toString()}`;
  }

  private mapResponse(response: FillStoreResponse): StoreOption[] {
    const rows = this.extractRows(response?.objresult);

    return rows
      .filter((row) => row.storeId != null && row.storeName && row.isActive !== false)
      .map((row) => ({
        storeId: row.storeId,
        storeName: row.storeName,
        isDefault: row.isDefault === true,
        isActive: row.isActive,
      }));
  }

  private extractRows(
    objresult: FillStoreResponse['objresult'] | undefined,
  ): Array<{ storeId: number; storeName: string; isDefault: boolean; isActive: boolean }> {
    if (!objresult) {
      return [];
    }

    const rows = Array.isArray(objresult) ? objresult : (objresult.table ?? []);

    return rows
      .map((row) => this.mapRow(row))
      .filter((row): row is { storeId: number; storeName: string; isDefault: boolean; isActive: boolean } => row != null && row.isActive !== false);
  }

  private mapRow(
    row: FillStoreRow,
  ): { storeId: number; storeName: string; isDefault: boolean; isActive: boolean } | null {
    const storeId = Number(
      row.StoreID ?? row.StoreId ?? row.storeID ?? row.storeId,
    );
    const storeName = String(row.StoreName ?? row.storeName ?? '').trim();

    if (!Number.isFinite(storeId) || !storeName) {
      return null;
    }

    const rawActive = row.IsActive ?? row.isActive;
    const isActive = rawActive === undefined || rawActive === null || rawActive === true || rawActive === 1 || rawActive === '1' || rawActive === 'Y' || rawActive === 'true' || rawActive === 'True';

    return {
      storeId,
      storeName,
      isDefault: row.IsDefault === true || row.isDefault === true,
      isActive,
    };
  }

  private toError(error: unknown): Error {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return new Error('Unable to reach the server. Check your connection and try again.');
      }

      return new Error('Unable to load stores. Please try again.');
    }

    if (error instanceof Error) {
      return error;
    }

    return new Error('Unable to load stores. Please try again.');
  }
}

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppConfigService } from '../../../services/app-config.service';
import { FillStoreResponse, StoreOption } from '../models/store.models';

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
      .filter((row) => row.storeId != null && row.storeName)
      .map((row) => ({
        storeId: row.storeId,
        storeName: row.storeName,
      }));
  }

  private extractRows(
    objresult: FillStoreResponse['objresult'] | undefined,
  ): Array<{ storeId: number; storeName: string }> {
    if (!objresult) {
      return [];
    }

    if (Array.isArray(objresult)) {
      return objresult
        .filter((row) => row?.StoreID != null && row.StoreName)
        .map((row) => ({
          storeId: row.StoreID,
          storeName: row.StoreName,
        }));
    }

    return (objresult.table ?? [])
      .filter((row) => row?.storeID != null && row.storeName)
      .map((row) => ({
        storeId: row.storeID,
        storeName: row.storeName,
      }));
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

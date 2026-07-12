import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppConfigService } from '../../../../services/app-config.service';
import {
  SaveSalesDetailsPayload,
  SaveSalesDetailsResponse,
  SaveSalesDetailsResult,
} from '../models/save-sales.models';

@Injectable({ providedIn: 'root' })
export class SaveSalesService {
  constructor(
    private readonly http: HttpClient,
    private readonly appConfig: AppConfigService,
  ) {}

  saveSalesDetails(payload: SaveSalesDetailsPayload): Promise<SaveSalesDetailsResult> {
    let url: string;

    try {
      url = this.buildUrl();
    } catch (error) {
      return Promise.reject(this.toError(error));
    }

    return firstValueFrom(this.http.post<SaveSalesDetailsResponse>(url, payload))
      .then((response) => this.mapResponse(response))
      .catch((error: unknown) => {
        throw this.toError(error);
      });
  }

  private buildUrl(): string {
    const settings = this.appConfig.settings;
    const apiUrl = settings?.apiUrl?.replace(/\/$/, '');
    const path = settings?.saveSalesDetailsPath ?? 'sales/SaveSalesDetails';

    if (!apiUrl) {
      throw new Error('Save sales is not configured.');
    }

    return `${apiUrl}/${path}`;
  }

  private mapResponse(response: SaveSalesDetailsResponse): SaveSalesDetailsResult {
    if (response.status && response.status !== '200') {
      throw new Error(response.message || 'Unable to save sale. Please try again.');
    }

    const salesDetails = response.objresult?.salesDetails?.[0] ?? null;
    const salesPrint = response.objresult?.salesPrint?.[0] ?? null;

    if (!salesDetails) {
      throw new Error('Sale saved but invoice details were not returned.');
    }

    return {
      status: response.status ?? '200',
      message: response.message ?? 'Sale saved successfully.',
      salesDetails,
      salesPrint,
      raw: response,
    };
  }

  private toError(error: unknown): Error {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return new Error('Unable to reach the server. Check your connection and try again.');
      }

      return new Error('Unable to save sale. Please try again.');
    }

    if (error instanceof Error) {
      return error;
    }

    return new Error('Unable to save sale. Please try again.');
  }
}

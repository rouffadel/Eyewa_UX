import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppConfigService } from '../../../../services/app-config.service';
import { PrescriptionSummary } from '../models/customer.models';
import {
  extractFirstSalesDetailsRow,
  extractSalesDetailsLineItems,
  extractSalesDetailsPayment,
  hasPrescriptionValues,
  mapSalesDetailsToPrescriptionSummary,
  SalesDetailsGridLineItem,
  SalesDetailsGridResponse,
  SalesDetailsGridRow,
  SalesDetailsPaymentSummary,
} from '../models/sales-details-grid.models';

export interface SalesDetailsResult {
  salesId: number;
  row: SalesDetailsGridRow | null;
  prescription: PrescriptionSummary | null;
  lineItems: SalesDetailsGridLineItem[];
  payment: SalesDetailsPaymentSummary | null;
}

@Injectable({ providedIn: 'root' })
export class SalesDetailsService {
  constructor(
    private readonly http: HttpClient,
    private readonly appConfig: AppConfigService,
  ) {}

  getSalesDetailsGrid(salesId: number): Promise<SalesDetailsResult> {
    let url: string;
    try {
      url = this.buildUrl(salesId);
    } catch (error) {
      return Promise.reject(this.toError(error));
    }

    return firstValueFrom(this.http.get<SalesDetailsGridResponse>(url))
      .then((response) => this.mapResponse(response, salesId))
      .catch((error: unknown) => {
        throw this.toError(error);
      });
  }

  private buildUrl(salesId: number): string {
    const settings = this.appConfig.settings;
    const apiUrl = settings?.apiUrl?.replace(/\/$/, '');
    const path = settings?.getSalesDetailsGridPath ?? 'sales/GetSalesDetailsGrid';

    if (!apiUrl) {
      throw new Error('Sales details lookup is not configured.');
    }

    const params = new URLSearchParams({ SalesId: String(salesId) });
    return `${apiUrl}/${path}?${params.toString()}`;
  }

  private mapResponse(
    response: SalesDetailsGridResponse,
    salesId: number,
  ): SalesDetailsResult {
    if (response.status && response.status !== '200') {
      throw new Error(response.message || 'Unable to load sales details.');
    }

    const row = extractFirstSalesDetailsRow(response.objresult);

    return {
      salesId,
      row,
      prescription: row && hasPrescriptionValues(row)
        ? mapSalesDetailsToPrescriptionSummary(row)
        : null,
      lineItems: extractSalesDetailsLineItems(response.objresult),
      payment: extractSalesDetailsPayment(response.objresult),
    };
  }

  private toError(error: unknown): Error {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return new Error('Unable to reach the server. Check your connection and try again.');
      }

      return new Error('Unable to load sales details. Please try again.');
    }

    if (error instanceof Error) {
      return error;
    }

    return new Error('Unable to load sales details. Please try again.');
  }
}

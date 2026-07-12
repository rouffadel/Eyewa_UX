import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppConfigService } from '../../../../services/app-config.service';
import {
  extractOrderLenseReadings,
  extractOrderLenseRows,
  GetOrderLenseResponse,
  normalizeOrderLenseEyeReading,
  normalizeOrderLenseRow,
  OrderLenseOrder,
} from '../models/order-lense.models';

@Injectable({ providedIn: 'root' })
export class OrderLenseService {
  constructor(
    private readonly http: HttpClient,
    private readonly appConfig: AppConfigService,
  ) {}

  getOrderLense(salesId: number): Promise<OrderLenseOrder> {
    let url: string;

    try {
      url = this.buildUrl(salesId);
    } catch (error) {
      return Promise.reject(this.toError(error));
    }

    return firstValueFrom(this.http.get<GetOrderLenseResponse>(url))
      .then((response) => this.mapResponse(response, salesId))
      .catch((error: unknown) => {
        throw this.toError(error);
      });
  }

  private buildUrl(salesId: number): string {
    const settings = this.appConfig.settings;
    const apiUrl = settings?.apiUrl?.replace(/\/$/, '');
    const getOrderLensePath = settings?.getOrderLensePath ?? 'prescriptions/GetOrderLense';

    if (!apiUrl) {
      throw new Error('Order lens lookup is not configured.');
    }

    const params = new URLSearchParams({
      SalesId: String(salesId),
    });

    return `${apiUrl}/${getOrderLensePath}?${params.toString()}`;
  }

  private mapResponse(response: GetOrderLenseResponse, salesId: number): OrderLenseOrder {
    if (response.status && response.status !== '200') {
      throw new Error(response.message || 'Unable to load order lenses. Please try again.');
    }

    const lenses = extractOrderLenseRows(response.objresult1)
      .map((row) => normalizeOrderLenseRow(row))
      .filter((line): line is NonNullable<typeof line> => line !== null);

    const readings = extractOrderLenseReadings(response.objresult2);

    return {
      salesId,
      lenses,
      od: normalizeOrderLenseEyeReading(readings.od),
      os: normalizeOrderLenseEyeReading(readings.os),
      additional: normalizeOrderLenseEyeReading(readings.additional),
    };
  }

  private toError(error: unknown): Error {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return new Error('Unable to reach the server. Check your connection and try again.');
      }

      return new Error('Unable to load order lenses. Please try again.');
    }

    if (error instanceof Error) {
      return error;
    }

    return new Error('Unable to load order lenses. Please try again.');
  }
}

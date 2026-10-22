import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppConfigService } from '../../../../services/app-config.service';
import { FramesSalesReportRow, GetFramesSalesReportResponse } from '../models/reports.models';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  constructor(
    private readonly http: HttpClient,
    private readonly appConfig: AppConfigService,
  ) {}

  private getApiUrl(): string {
    const settings = this.appConfig.settings as any;
    return settings?.apiUrl?.replace(/\/$/, '') || 'https://localhost:7207/api';
  }

  async getOrdersReport(
    fromDate: string,
    toDate: string,
    storeId?: number,
  ): Promise<any[]> {
    const apiUrl = this.getApiUrl();
    const params = new URLSearchParams();
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    if (storeId && storeId > 0) params.append('storeId', String(storeId));
    params.append('take', '200');

    const url = `${apiUrl}/sales/order-status-list?${params.toString()}`;
    try {
      const response = await firstValueFrom(this.http.get<any>(url));
      return Array.isArray(response)
        ? response
        : (Array.isArray(response?.items)
            ? response.items
            : (Array.isArray(response?.result)
                ? response.result
                : (Array.isArray(response?.data) ? response.data : [])));
    } catch (err) {
      console.warn('Could not fetch orders from order-status-list:', err);
      return [];
    }
  }

  async getFramesSalesReport(
    fromDate: string,
    toDate: string,
    storeId: number,
  ): Promise<GetFramesSalesReportResponse> {
    const apiUrl = this.getApiUrl();
    const path = 'sales/GetFramesSalesReport';

    const query = new URLSearchParams({
      fromDate,
      toDate,
      storeId: String(storeId),
    });

    const url = `${apiUrl}/${path}?${query.toString()}`;

    try {
      const response = await firstValueFrom(this.http.get<GetFramesSalesReportResponse>(url));
      return response;
    } catch (error) {
      throw this.toError(error);
    }
  }

  private toError(error: unknown): Error {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return new Error('Unable to reach the server. Check your connection and try again.');
      }
      return new Error('Unable to load report data. Please try again.');
    }
    if (error instanceof Error) {
      return error;
    }
    return new Error('Unable to load report data. Please try again.');
  }
}

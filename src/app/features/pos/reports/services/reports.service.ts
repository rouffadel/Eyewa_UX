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

  async getFramesSalesReport(
    fromDate: string,
    toDate: string,
    storeId: number,
  ): Promise<GetFramesSalesReportResponse> {
    const settings = this.appConfig.settings;
    const apiUrl = settings?.apiUrl?.replace(/\/$/, '');
    const path = 'sales/GetFramesSalesReport';

    if (!apiUrl) {
      throw new Error('API URL is not configured.');
    }

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

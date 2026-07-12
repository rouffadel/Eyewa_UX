import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppConfigService } from '../../../../services/app-config.service';
import {
  InsertSalesPayload,
  InsertSalesResponse,
  InsertSalesResult,
} from '../models/customer-sales.models';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  constructor(
    private readonly http: HttpClient,
    private readonly appConfig: AppConfigService,
  ) {}

  insertSales(payload: InsertSalesPayload): Promise<InsertSalesResult> {
    const url = this.buildUrl();

    return firstValueFrom(this.http.post<InsertSalesResponse>(url, payload))
      .then((response) => this.mapResponse(response))
      .catch((error: unknown) => {
        throw this.toError(error);
      });
  }

  private buildUrl(): string {
    const settings = this.appConfig.settings;
    const apiUrl = settings?.apiUrl?.replace(/\/$/, '');
    const insertSalesPath = settings?.insertSalesPath ?? 'Admin/InsertSales';

    if (!apiUrl) {
      throw new Error('Customer save is not configured.');
    }

    return `${apiUrl}/${insertSalesPath}`;
  }

  private mapResponse(response: InsertSalesResponse): InsertSalesResult {
    if (response.status && response.status !== '200') {
      throw new Error(response.message || 'Unable to save customer. Please try again.');
    }

    const row = this.extractRow(response?.objresult);
    if (!row) {
      throw new Error('Unable to save customer. Please try again.');
    }

    return {
      status: row.status,
      message: response.message,
      responseStatus: response.status,
      id: row.id,
      invoiceNo: row.invoiceNo,
      customerNo: row.customerNo,
      customerName: row.customerName,
    };
  }

  private extractRow(
    objresult: InsertSalesResponse['objresult'] | undefined,
  ): {
    status: string;
    id: number;
    invoiceNo: string;
    customerNo: string;
    customerName?: string;
  } | null {
    if (!objresult) {
      return null;
    }

    if (Array.isArray(objresult)) {
      const row = objresult[0];
      if (!row?.ID) {
        return null;
      }

      return {
        status: row.Status,
        id: row.ID,
        invoiceNo: row.InvoiceNo,
        customerNo: row.CustomerNo,
        customerName: row.CustomerName,
      };
    }

    const row = objresult.table?.[0];
    if (!row?.id) {
      return null;
    }

    return {
      status: row.status,
      id: row.id,
      invoiceNo: row.invoiceNo,
      customerNo: row.customerNo,
    };
  }

  private toError(error: unknown): Error {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return new Error('Unable to reach the server. Check your connection and try again.');
      }

      return new Error('Unable to save customer. Please try again.');
    }

    if (error instanceof Error) {
      return error;
    }

    return new Error('Unable to save customer. Please try again.');
  }
}

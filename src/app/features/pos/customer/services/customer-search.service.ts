import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppConfigService } from '../../../../services/app-config.service';
import { Customer } from '../../sell/models/customer.models';
import {
  CustomerSearchResponse,
  mapCustomerSearchRow,
  validateCustomerSearchQuery,
} from '../models/customer-search.models';

@Injectable({ providedIn: 'root' })
export class CustomerSearchService {
  constructor(
    private readonly http: HttpClient,
    private readonly appConfig: AppConfigService,
  ) {}

  search(rawQuery: string): Promise<Customer[]> {
    const validation = validateCustomerSearchQuery(rawQuery);
    if (!validation.valid) {
      if (!validation.query) {
        return Promise.resolve([]);
      }

      return Promise.reject(new Error(validation.message ?? 'Invalid search query.'));
    }

    const url = this.buildUrl(validation.query);

    return firstValueFrom(this.http.get<CustomerSearchResponse>(url))
      .then((response) => this.mapResponse(response))
      .catch((error: unknown) => {
        throw this.toError(error);
      });
  }

  private buildUrl(query: string): string {
    const settings = this.appConfig.settings;
    const apiUrl = settings?.apiUrl?.replace(/\/$/, '');
    const searchPath = settings?.customerSearchPath ?? 'sales/customersearchfilter';

    if (!apiUrl) {
      throw new Error('Customer search is not configured.');
    }

    const params = new URLSearchParams({
      mobileNumber: query,
    });

    return `${apiUrl}/${searchPath}?${params.toString()}`;
  }

  private mapResponse(response: CustomerSearchResponse): Customer[] {
    if (response.status && response.status !== '200') {
      throw new Error(response.message || 'Unable to search customers. Please try again.');
    }

    return (response.objresult ?? [])
      .filter((row) => row?.ID != null && row.CustomerName)
      .map((row) => mapCustomerSearchRow(row));
  }

  private toError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }

    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return new Error('Unable to reach the server. Check your connection and try again.');
      }

      return new Error('Unable to search customers. Please try again.');
    }

    return new Error('Unable to search customers. Please try again.');
  }
}

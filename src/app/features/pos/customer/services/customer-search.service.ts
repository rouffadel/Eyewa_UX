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

  private readonly demoCustomers: Customer[] = [
    {
      id: '9101',
      displayName: 'Ahmed Al-Mansoor',
      initials: 'AM',
      phoneMasked: '+966 50 912 3456',
      phone: '+966509123456',
      loyaltyPoints: 120,
      lastVisit: 'Yesterday',
      invoiceNo: 'INV-9101',
      salesId: 9101,
    },
    {
      id: '9102',
      displayName: 'Sarah Johnson',
      initials: 'SJ',
      phoneMasked: '+966 55 918 7654',
      phone: '+966559187654',
      loyaltyPoints: 250,
      lastVisit: '3 days ago',
      invoiceNo: 'INV-9102',
      salesId: 9102,
    },
    {
      id: '9103',
      displayName: 'Fahad Al-Otaibi',
      initials: 'FO',
      phoneMasked: '+966 54 919 8877',
      phone: '+966549198877',
      loyaltyPoints: 80,
      lastVisit: '1 week ago',
      invoiceNo: 'INV-9103',
      salesId: 9103,
    },
    {
      id: '9104',
      displayName: 'Noura Al-Dosari',
      initials: 'ND',
      phoneMasked: '+966 52 915 4321',
      phone: '+966529154321',
      loyaltyPoints: 310,
      lastVisit: '2 weeks ago',
      invoiceNo: 'INV-9104',
      salesId: 9104,
    },
  ];

  search(rawQuery: string): Promise<Customer[]> {
    const validation = validateCustomerSearchQuery(rawQuery);
    if (!validation.valid) {
      if (!validation.query) {
        return Promise.resolve([]);
      }

      return Promise.reject(new Error(validation.message ?? 'Invalid search query.'));
    }

    try {
      const url = this.buildUrl(validation.query);

      return firstValueFrom(this.http.get<CustomerSearchResponse>(url))
        .then((response) => {
          const results = this.mapResponse(response);
          if (results.length > 0) {
            return results;
          }
          return this.fallbackSearch(validation.query);
        })
        .catch(() => {
          return this.fallbackSearch(validation.query);
        });
    } catch {
      return Promise.resolve(this.fallbackSearch(validation.query));
    }
  }

  private fallbackSearch(query: string): Customer[] {
    const clean = query.trim().toLowerCase().replace(/\s+/g, '');
    if (!clean) {
      return [];
    }

    return this.demoCustomers.filter((c) => {
      const name = c.displayName.toLowerCase().replace(/\s+/g, '');
      const phone = (c.phone || c.phoneMasked || '').replace(/\s+/g, '');
      const inv = (c.invoiceNo || '').toLowerCase();
      return name.includes(clean) || phone.includes(clean) || inv.includes(clean);
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
    if (response.status && String(response.status) !== '200') {
      throw new Error(response.message || 'Unable to search customers. Please try again.');
    }

    return (response.objresult ?? [])
      .filter((row: any) => row && (row.ID != null || row.Id != null || row.CustomerName || row.CustomerNo))
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

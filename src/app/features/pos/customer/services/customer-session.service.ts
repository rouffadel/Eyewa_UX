import { Injectable, computed, signal } from '@angular/core';
import { Customer } from '../../sell/models/customer.models';
import {
  buildCreatedCustomerSession,
  CreatedCustomerSession,
  InsertSalesPayload,
  InsertSalesResult,
} from '../models/customer-sales.models';

const STORAGE_KEY = 'eyewa_customer_session';

@Injectable({ providedIn: 'root' })
export class CustomerSessionService {
  private readonly session = signal<CreatedCustomerSession | null>(this.readStoredSession());

  readonly currentCustomer = this.session.asReadonly();
  readonly sellCustomer = computed(() => {
    const record = this.session();
    return record ? this.toSellCustomer(record) : null;
  });

  saveFromCreate(payload: InsertSalesPayload, result: InsertSalesResult): CreatedCustomerSession {
    const record = buildCreatedCustomerSession(payload, result);
    this.session.set(record);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    return record;
  }

  clear(): void {
    sessionStorage.removeItem(STORAGE_KEY);
    this.session.set(null);
  }

  toSellCustomer(record: CreatedCustomerSession = this.session()!): Customer {
    return {
      id: String(record.salesId),
      displayName: record.customerName,
      initials: this.initialsFromName(record.customerName),
      phoneMasked: record.customerNo,
      phone: record.customerNo,
      loyaltyPoints: 0,
      lastVisit: record.invoiceDate,
      invoiceNo: record.invoiceNo,
      salesId: record.salesId,
    };
  }

  private initialsFromName(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);

    if (parts.length === 0) {
      return 'C';
    }

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  private readStoredSession(): CreatedCustomerSession | null {
    const raw = sessionStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    try {
      const record = JSON.parse(raw) as CreatedCustomerSession;
      return record?.salesId && record?.customerName ? record : null;
    } catch {
      return null;
    }
  }
}

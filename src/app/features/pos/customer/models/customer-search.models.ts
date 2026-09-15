import { Customer } from '../../sell/models/customer.models';

export const CUSTOMER_SEARCH_MIN_LENGTH = 2;
export const CUSTOMER_SEARCH_MAX_LENGTH = 30;

export interface CustomerSearchRow {
  ID: number;
  InvoiceNo: string;
  CustomerNo: string;
  CustomerName: string;
  chkavail: unknown;
}

export interface CustomerSearchResponse {
  status: string;
  message: string;
  objresult: CustomerSearchRow[];
  qrcodeimg: string | null;
}

export interface CustomerSearchValidation {
  valid: boolean;
  message: string | null;
  query: string;
}

export function validateCustomerSearchQuery(raw: string): CustomerSearchValidation {
  const query = raw.trim();

  if (!query) {
    return { valid: false, message: null, query };
  }

  if (query.length < CUSTOMER_SEARCH_MIN_LENGTH) {
    return {
      valid: false,
      message: `Enter at least ${CUSTOMER_SEARCH_MIN_LENGTH} characters to search.`,
      query,
    };
  }

  if (query.length > CUSTOMER_SEARCH_MAX_LENGTH) {
    return {
      valid: false,
      message: `Search must be ${CUSTOMER_SEARCH_MAX_LENGTH} characters or fewer.`,
      query,
    };
  }

  if (!/^[\d\s+a-zA-Z+-]+$/.test(query)) {
    return {
      valid: false,
      message: 'Search can only include letters, numbers, spaces, +, and -.',
      query,
    };
  }

  return { valid: true, message: null, query };
}

export function mapCustomerSearchRow(row: any): Customer {
  const name = row.CustomerName || row.Name || row.CustomerNo || row.CustomerCode || 'Customer';
  const phone = row.CustomerNo || row.MobileNo || row.Phone || row.ContactNo || '';
  return {
    id: String(row.ID ?? row.Id ?? row.id ?? Math.random()),
    displayName: name,
    initials: initialsFromName(name),
    phoneMasked: phone,
    phone: phone,
    loyaltyPoints: Number(row.LoyaltyPoints ?? row.loyaltyPoints ?? 0),
    lastVisit: '—',
    invoiceNo: row.InvoiceNo || row.invoiceNo || '',
    salesId: Number(row.ID ?? row.salesId ?? 0),
  };
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return 'C';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

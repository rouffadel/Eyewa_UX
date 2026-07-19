export interface InsuranceCompanyOption {
  id: number;
  name: string;
}

export interface GetAllInsuranceCompaniesApiRow {
  InsuranceCompanyId?: number;
  InsuranceCompanyName?: string;
  TaxRegistrationNumber?: string | null;
  ContactEmail?: string | null;
  ContactPhone?: string | null;
  IsActive?: boolean;
}

export interface GetAllInsuranceCompaniesResponse {
  status: string;
  message: string;
  objresult?: GetAllInsuranceCompaniesApiRow[] | null;
  qrcodeimg?: string | null;
}

export function normalizeInsuranceCompanyOption(
  row: GetAllInsuranceCompaniesApiRow,
): InsuranceCompanyOption | null {
  const id = row.InsuranceCompanyId;
  if (id == null) {
    return null;
  }

  if (row.IsActive === false) {
    return null;
  }

  const name = String(row.InsuranceCompanyName ?? '').trim();
  return {
    id,
    name: name || `Company #${id}`,
  };
}

export interface SalesInsuranceRecord {
  salesInsuranceId: number;
  salesId: number;
  insuranceCompanyId: number;
  insuranceCompanyName: string;
  taxRegistrationNumber: string | null;
  policyNumber: string;
  discountPercentage: number;
  validityEndDate: string;
  isActive: boolean;
}

export interface GetInsuranceBySalesIdApiRow {
  SalesInsuranceId?: number;
  SalesId?: number;
  InsuranceCompanyId?: number;
  InsuranceCompanyName?: string;
  TaxRegistrationNumber?: string | null;
  PolicyNumber?: string;
  DiscountPercentage?: number;
  ValidityEndDate?: string;
  IsActive?: boolean;
}

export interface GetInsuranceBySalesIdResponse {
  status: string;
  message: string;
  objresult?: GetInsuranceBySalesIdApiRow[] | null;
  qrcodeimg?: string | null;
}

export interface SaveSalesInsurancePayload {
  SalesId: number;
  InsuranceCompanyId: number;
  PolicyNumber: string;
  DiscountPercentage: number;
  ValidityEndDate: string;
}

export interface SaveSalesInsuranceResponse {
  status: string;
  message: string;
  objresult?: unknown;
  qrcodeimg?: string | null;
}

export interface InsuranceFormValue {
  insuranceCompanyId: number | null;
  policyNumber: string;
  discountPercentage: number | null;
  validityEndDate: string;
}

export function buildSaveSalesInsurancePayload(
  salesId: number,
  value: InsuranceFormValue,
): SaveSalesInsurancePayload {
  if (value.insuranceCompanyId == null) {
    throw new Error('Insurance company is required.');
  }

  if (value.discountPercentage == null || !Number.isFinite(value.discountPercentage)) {
    throw new Error('Discount percentage is required.');
  }

  const policyNumber = value.policyNumber.trim();
  if (!policyNumber) {
    throw new Error('Policy number is required.');
  }

  const validityEndDate = toApiDateTime(value.validityEndDate);
  if (!validityEndDate) {
    throw new Error('Validity end date is required.');
  }

  return {
    SalesId: salesId,
    InsuranceCompanyId: value.insuranceCompanyId,
    PolicyNumber: policyNumber,
    DiscountPercentage: value.discountPercentage,
    ValidityEndDate: validityEndDate,
  };
}

export function normalizeSalesInsuranceRow(
  row: GetInsuranceBySalesIdApiRow,
): SalesInsuranceRecord | null {
  const salesInsuranceId = row.SalesInsuranceId;
  const salesId = row.SalesId;
  const insuranceCompanyId = row.InsuranceCompanyId;

  if (salesInsuranceId == null || salesId == null || insuranceCompanyId == null) {
    return null;
  }

  return {
    salesInsuranceId,
    salesId,
    insuranceCompanyId,
    insuranceCompanyName: String(row.InsuranceCompanyName ?? '').trim(),
    taxRegistrationNumber: row.TaxRegistrationNumber ?? null,
    policyNumber: String(row.PolicyNumber ?? '').trim(),
    discountPercentage: Number(row.DiscountPercentage ?? 0),
    validityEndDate: String(row.ValidityEndDate ?? ''),
    isActive: row.IsActive !== false,
  };
}

/** Converts API datetime to `YYYY-MM-DD` for `<input type="date">`. */
export function toDateInputValue(isoDate: string | null | undefined): string {
  if (!isoDate) {
    return '';
  }

  const match = /^(\d{4}-\d{2}-\d{2})/.exec(isoDate.trim());
  return match?.[1] ?? '';
}

/** Converts date input value to API datetime `YYYY-MM-DDT00:00:00`. */
export function toApiDateTime(dateInput: string): string {
  const date = dateInput.trim();
  if (!date) {
    return '';
  }

  return date.includes('T') ? date : `${date}T00:00:00`;
}

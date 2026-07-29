import { PrescriptionEyeValues, PrescriptionSummary } from './customer.models';

/** Raw row from GetSalesDetailsGrid (PascalCase API fields). */
export interface SalesDetailsGridApiRow {
  SaleID?: number;
  saleID?: number;
  CustomerName?: string;
  customerName?: string;
  CustomerNo?: string;
  customerNo?: string;
  InvoiceNo?: string;
  invoiceNo?: string;
  InvoiceDate?: string;
  invoiceDate?: string;
  SPH_RightEye?: string | number | null;
  spH_RightEye?: string | number | null;
  CYL_RightEye?: string | number | null;
  cyL_RightEye?: string | number | null;
  AXIS_RightEye?: string | number | null;
  axiS_RightEye?: string | number | null;
  ADD_RightEye?: string | number | null;
  adD_RightEye?: string | number | null;
  SPH_LeftEye?: string | number | null;
  spH_LeftEye?: string | number | null;
  CYL_LeftEye?: string | number | null;
  cyL_LeftEye?: string | number | null;
  AXIS_LeftEye?: string | number | null;
  axiS_LeftEye?: string | number | null;
  ADD_LeftEye?: string | number | null;
  adD_LeftEye?: string | number | null;
  SPH_IPD?: string | number | null;
  spH_IPD?: string | number | null;
  CYL_IPD?: string | number | null;
  cyL_IPD?: string | number | null;
  AXIS_IPD?: string | number | null;
  axiS_IPD?: string | number | null;
  ADD_IPD?: string | number | null;
  adD_IPD?: string | number | null;
  GrossTotal?: number;
  grossTotal?: number;
  Discount?: number;
  discount?: number;
  NetTotal?: number;
  netTotal?: number;
  Balance?: number;
  balance?: number;
  TotalTax?: number;
  totalTax?: number;
  InsuranceAmount?: number;
  insuranceAmount?: number;
}

export interface SalesDetailsGridLineApiRow {
  CategoryName?: string;
  categoryName?: string;
  CategoryID?: number;
  categoryID?: number;
  BrandID?: number;
  brandID?: number;
  ProductID?: number;
  productID?: number;
  SellingPrice?: number;
  sellingPrice?: number;
  ProductValue?: number;
  productValue?: number;
  Quantity?: number;
  quantity?: number;
  SalesDetailsID?: number;
  salesDetailsID?: number;
  ProductName?: string;
  productName?: string;
  BrandName?: string;
  brandName?: string;
  MaxDiscount?: number;
  maxDiscount?: number;
  Discount?: number;
  discount?: number;
  Tax?: number;
  tax?: number;
  TaxPercent?: number;
  taxPercent?: number;
}

export interface SalesDetailsPaidAmountApiRow {
  PaidAmount?: number | null;
  paidAmount?: number | null;
}

export interface SalesDetailsGridRow {
  saleId: number;
  customerName: string;
  customerNo: string;
  invoiceNo: string;
  invoiceDate: string;
  sphRightEye: string | number | null;
  cylRightEye: string | number | null;
  axisRightEye: string | number | null;
  addRightEye: string | number | null;
  sphLeftEye: string | number | null;
  cylLeftEye: string | number | null;
  axisLeftEye: string | number | null;
  addLeftEye: string | number | null;
  sphIpd: string | number | null;
  cylIpd: string | number | null;
  axisIpd: string | number | null;
  addIpd: string | number | null;
  grossTotal: number;
  discount: number;
  netTotal: number;
  balance: number;
  totalTax: number;
  insuranceAmount: number;
}

export interface SalesDetailsGridLineItem {
  salesDetailsId: number;
  categoryName: string;
  categoryId: number;
  brandId: number;
  productId: number;
  brandName: string;
  productName: string;
  sellingPrice: number;
  productValue: number;
  quantity: number;
  maxDiscount: number;
  discountPercent: number;
  tax: number;
  taxPercent: number;
}

export interface SalesDetailsPaymentSummary {
  grossTotal: number;
  discount: number;
  netTotal: number;
  balance: number;
  totalTax: number;
  paidAmount: number | null;
  insuranceAmount: number;
}

export type SalesDetailsGridObjResult =
  | SalesDetailsGridApiRow[]
  | {
      table?: SalesDetailsGridApiRow[];
      table1?: SalesDetailsGridLineApiRow[];
      table2?: SalesDetailsPaidAmountApiRow[];
      table3?: unknown[];
    };

export interface SalesDetailsGridResponse {
  status: string;
  message: string;
  objresult?: SalesDetailsGridObjResult;
  qrcodeimg: string | null;
}

export function extractFirstSalesDetailsRow(
  objresult: SalesDetailsGridObjResult | undefined,
): SalesDetailsGridRow | null {
  const raw = extractRawRows(objresult)[0];
  return raw ? normalizeSalesDetailsRow(raw) : null;
}

export function extractSalesDetailsLineItems(
  objresult: SalesDetailsGridObjResult | undefined,
): SalesDetailsGridLineItem[] {
  if (!objresult || Array.isArray(objresult)) {
    return [];
  }

  return (objresult.table1 ?? [])
    .map((row) => normalizeSalesDetailsLineItem(row))
    .filter((line): line is SalesDetailsGridLineItem => line !== null);
}

export function extractSalesDetailsPayment(
  objresult: SalesDetailsGridObjResult | undefined,
): SalesDetailsPaymentSummary | null {
  const row = extractFirstSalesDetailsRow(objresult);
  if (!row) {
    return null;
  }

  const paidRow = !objresult || Array.isArray(objresult) ? undefined : objresult.table2?.[0];
  const paidAmount = paidRow?.PaidAmount ?? paidRow?.paidAmount ?? null;

  return {
    grossTotal: row.grossTotal,
    discount: row.discount,
    netTotal: row.netTotal,
    balance: row.balance,
    totalTax: row.totalTax,
    paidAmount: paidAmount == null ? null : Number(paidAmount),
    insuranceAmount: row.insuranceAmount,
  };
}

function extractRawRows(objresult: SalesDetailsGridObjResult | undefined): SalesDetailsGridApiRow[] {
  if (!objresult) {
    return [];
  }

  if (Array.isArray(objresult)) {
    return objresult;
  }

  return objresult.table ?? [];
}

function normalizeSalesDetailsRow(raw: SalesDetailsGridApiRow): SalesDetailsGridRow {
  return {
    saleId: raw.SaleID ?? raw.saleID ?? 0,
    customerName: raw.CustomerName ?? raw.customerName ?? '',
    customerNo: raw.CustomerNo ?? raw.customerNo ?? '',
    invoiceNo: raw.InvoiceNo ?? raw.invoiceNo ?? '',
    invoiceDate: raw.InvoiceDate ?? raw.invoiceDate ?? '',
    sphRightEye: raw.SPH_RightEye ?? raw.spH_RightEye ?? null,
    cylRightEye: raw.CYL_RightEye ?? raw.cyL_RightEye ?? null,
    axisRightEye: raw.AXIS_RightEye ?? raw.axiS_RightEye ?? null,
    addRightEye: raw.ADD_RightEye ?? raw.adD_RightEye ?? null,
    sphLeftEye: raw.SPH_LeftEye ?? raw.spH_LeftEye ?? null,
    cylLeftEye: raw.CYL_LeftEye ?? raw.cyL_LeftEye ?? null,
    axisLeftEye: raw.AXIS_LeftEye ?? raw.axiS_LeftEye ?? null,
    addLeftEye: raw.ADD_LeftEye ?? raw.adD_LeftEye ?? null,
    sphIpd: raw.SPH_IPD ?? raw.spH_IPD ?? null,
    cylIpd: raw.CYL_IPD ?? raw.cyL_IPD ?? null,
    axisIpd: raw.AXIS_IPD ?? raw.axiS_IPD ?? null,
    addIpd: raw.ADD_IPD ?? raw.adD_IPD ?? null,
    grossTotal: raw.GrossTotal ?? raw.grossTotal ?? 0,
    discount: raw.Discount ?? raw.discount ?? 0,
    netTotal: raw.NetTotal ?? raw.netTotal ?? 0,
    balance: raw.Balance ?? raw.balance ?? 0,
    totalTax: raw.TotalTax ?? raw.totalTax ?? 0,
    insuranceAmount: raw.InsuranceAmount ?? raw.insuranceAmount ?? 0,
  };
}

function normalizeSalesDetailsLineItem(
  raw: SalesDetailsGridLineApiRow,
): SalesDetailsGridLineItem | null {
  const productId = raw.ProductID ?? raw.productID;
  const salesDetailsId = raw.SalesDetailsID ?? raw.salesDetailsID;

  if (productId == null || salesDetailsId == null) {
    return null;
  }

  return {
    salesDetailsId,
    categoryName: raw.CategoryName ?? raw.categoryName ?? '',
    categoryId: raw.CategoryID ?? raw.categoryID ?? 0,
    brandId: raw.BrandID ?? raw.brandID ?? 0,
    productId,
    brandName: raw.BrandName ?? raw.brandName ?? '',
    productName: raw.ProductName ?? raw.productName ?? '',
    sellingPrice: raw.SellingPrice ?? raw.sellingPrice ?? 0,
    productValue: raw.ProductValue ?? raw.productValue ?? 0,
    quantity: Math.max(1, raw.Quantity ?? raw.quantity ?? 1),
    maxDiscount: raw.MaxDiscount ?? raw.maxDiscount ?? 0,
    discountPercent: raw.Discount ?? raw.discount ?? 0,
    tax: raw.Tax ?? raw.tax ?? 0,
    taxPercent: raw.TaxPercent ?? raw.taxPercent ?? 0,
  };
}

/** True when the sales row carries at least one prescription eye value. */
export function hasPrescriptionValues(row: SalesDetailsGridRow): boolean {
  return [
    row.sphRightEye,
    row.cylRightEye,
    row.axisRightEye,
    row.addRightEye,
    row.sphLeftEye,
    row.cylLeftEye,
    row.axisLeftEye,
    row.addLeftEye,
  ].some((value) => value !== null && value !== undefined && `${value}`.trim() !== '');
}

export function mapSalesDetailsToPrescriptionSummary(
  row: SalesDetailsGridRow,
): PrescriptionSummary {
  return {
    date: formatDisplayDate(row.invoiceDate),
    doctorName: '—',
    od: mapEye(row.sphRightEye, row.cylRightEye, row.axisRightEye, row.addRightEye),
    os: mapEye(row.sphLeftEye, row.cylLeftEye, row.axisLeftEye, row.addLeftEye),
    pd: formatValue(row.sphIpd),
    nearPd: formatValue(row.addIpd),
  };
}

function mapEye(
  sph: string | number | null,
  cyl: string | number | null,
  axis: string | number | null,
  add: string | number | null,
): PrescriptionEyeValues {
  return {
    sph: formatValue(sph),
    cyl: formatValue(cyl),
    axis: formatValue(axis),
    add: formatValue(add),
  };
}

function formatValue(value: string | number | null): string {
  if (value === null || value === undefined || `${value}`.trim() === '') {
    return '—';
  }

  return `${value}`.trim();
}

function formatDisplayDate(raw: string): string {
  if (!raw) {
    return '—';
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return raw;
  }

  const day = `${date.getDate()}`.padStart(2, '0');
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  return `${day}-${month}-${date.getFullYear()}`;
}

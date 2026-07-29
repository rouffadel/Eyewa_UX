export interface SaveSalesGridPayload {
  SalesDetailId: number;
  CategoryId: number;
  BrandId: number;
  ProductId: number;
  ProductValue: number;
  Quantity: string;
  Discount: number;
  SellingPrice: string;
  Tax: number;
  TaxPer: number;
}

export interface SaveSalesPaymentPayload {
  PaidAmount: number;
  AdvancePaidAmount: number;
  InsuranceAmount: string;
  PaymentMode: string;
}

export interface SaveSalesDetailsPayload {
  SalesId: number;
  LoginId: number;
  StoreId: string;
  SalesGrids: SaveSalesGridPayload[];
  GrossTotal: number;
  Discount: number;
  Tax: string;
  NetTotal: string;
  Balance: string;
  PaidAmount?: number;
  AdvancePaidAmount?: number;
  PaymentMode?: string;
  /** Insurance coverage amount; empty string when no insurance is applied. */
  InsuranceAmount?: string;
  payments?: SaveSalesPaymentPayload[];
  CustomerName: string;
  CustomerNo: string;
  SalesManId: number;
  DeliveryDate?: string;
  EarnedLoyaltyPoints?: number;
  RedeemedLoyaltyPoints?: number;
}

export interface SaveSalesDetailsRow {
  SaleID: number;
  CustomerName: string;
  CustomerNo: string;
  GrossTotal: number;
  Discount: number;
  NetTotal: number;
  Balance: number;
  UserID?: number;
  StoreID?: number;
  InvoiceNo: string;
  InvoiceDate: string;
  CreatedBy?: number;
  SPH_RightEye?: string | null;
  CYL_RightEye?: string | null;
  AXIS_RightEye?: string | null;
  ADD_RightEye?: string | null;
  SPH_LeftEye?: string | null;
  CYL_LeftEye?: string | null;
  AXIS_LeftEye?: string | null;
  ADD_LeftEye?: string | null;
  SPH_IPD?: string | null;
  CYL_IPD?: string | null;
  AXIS_IPD?: string | null;
  ADD_IPD?: string | null;
}

export interface SaveSalesPrintRow {
  StoreName: string;
  Address: string;
  InvoiceDate: string;
  InvoiceNo: string;
  CustomerName: string;
  CustomerNo: string;
  GrossTotal: number;
  Discount: number;
  NetTotal: number;
  Name: string | null;
}

export interface SaveSalesDetailsObjResult {
  salesDetails?: SaveSalesDetailsRow[];
  salesPrint?: SaveSalesPrintRow[];
}

export interface SaveSalesDetailsResponse {
  status?: string;
  message?: string;
  objresult?: SaveSalesDetailsObjResult;
  qrcodeimg?: string | null;
}

export interface SaveSalesDetailsResult {
  status: string;
  message: string;
  salesDetails: SaveSalesDetailsRow | null;
  salesPrint: SaveSalesPrintRow | null;
  raw: SaveSalesDetailsResponse;
}

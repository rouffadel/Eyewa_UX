export interface InsertSalesPayload {
  storeId: string;
  customerName: string;
  customerNo: string;
  loginId: string;
  invoiceNo: string;
  invoiceDate: string;
}

export interface InsertSalesResult {
  status: string;
  message: string;
  responseStatus: string;
  id: number;
  invoiceNo: string;
  customerNo: string;
  customerName?: string;
}

export interface InsertSalesRow {
  Status: string;
  ID: number;
  InvoiceNo: string;
  CustomerNo: string;
  CustomerName?: string;
  chkavail: unknown;
}

/** Current API shape — `objresult` is a result array. */
export type InsertSalesObjResult =
  | InsertSalesRow[]
  | {
      table: Array<{
        status: string;
        id: number;
        invoiceNo: string;
        customerNo: string;
        chkavail: unknown;
      }>;
    };

export interface InsertSalesResponse {
  status: string;
  message: string;
  objresult: InsertSalesObjResult;
  qrcodeimg: string | null;
}

export function formatInvoiceDate(date: Date = new Date()): string {
  return `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
}

/** Persisted after InsertSales — form input + API response. */
export interface CreatedCustomerSession {
  customerName: string;
  customerNo: string;
  storeId: string;
  loginId: string;
  invoiceNo: string;
  invoiceDate: string;
  salesId: number;
  recordStatus: string;
  apiStatus: string;
  apiMessage: string;
  createdAt: string;
}

export function buildCreatedCustomerSession(
  payload: InsertSalesPayload,
  result: InsertSalesResult,
): CreatedCustomerSession {
  return {
    customerName: result.customerName || payload.customerName,
    customerNo: result.customerNo || payload.customerNo,
    storeId: payload.storeId,
    loginId: payload.loginId,
    invoiceNo: result.invoiceNo,
    invoiceDate: payload.invoiceDate,
    salesId: result.id,
    recordStatus: result.status,
    apiStatus: result.responseStatus,
    apiMessage: result.message,
    createdAt: new Date().toISOString(),
  };
}

export interface SaveOrderLensePayload {
  OrderLenses: SaveOrderLenseLine[];
  PrescriptionDetails: SaveOrderLensePrescriptionDetail[];
  PrescriptionIpd: SaveOrderLenseIpd;
  SalesId: number;
}

export interface SaveOrderLenseLine {
  OrderLenseId: number;
  CategoryId: string;
  Brand: string;
  Price: string;
  Quantity: string;
  Total: number;
}

export interface SaveOrderLensePrescriptionDetail {
  sph: string;
  cyl: string;
  axis: string;
  add: string;
}

export interface SaveOrderLenseIpd {
  sphtext: string;
  cyltext: string;
  axistext: string;
  addtext: string;
}

export interface SaveOrderLenseRow {
  status?: string;
  id?: number;
  invoiceNo?: string;
  customerNo?: string;
  chkavail?: unknown;
  Status?: string;
  ID?: number;
  InvoiceNo?: string;
  CustomerNo?: string;
}

export type SaveOrderLenseObjResult =
  | SaveOrderLenseRow[]
  | {
      table?: SaveOrderLenseRow[];
    };

export interface SaveOrderLenseResponse {
  status: string;
  message: string;
  objresult?: SaveOrderLenseObjResult;
  qrcodeimg?: string | null;
}

export interface SaveOrderLenseResult {
  status: string;
  message: string;
  responseStatus: string;
  id: number;
  invoiceNo: string;
  customerNo: string;
}

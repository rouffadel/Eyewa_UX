export interface FramesSalesReportRow {
  SaleID: number;
  StoreName: string;
  CustomerName: string;
  CustomerNo: string;
  InvoicePaymentID: number;
  PaymentDate: string;
  PaymentAmount: number;
  PaymentMode: string;
  InsuranceAmount: number;
  NetTotal: number;
  Balance: number;
  Products: string;
}

export interface GetFramesSalesReportResponse {
  status: string;
  message: string;
  objresult: FramesSalesReportRow[];
  extraData?: {
    TotalAmount: number;
    TotalInsurance: number;
    TotalNetTotal: number;
    TotalBalance: number;
  };
  qrcodeimg?: string | null;
}

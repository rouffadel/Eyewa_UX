export interface InvoiceProductLine {
  category: string;
  brand: string;
  modelNo: string;
  sellingPrice: string;
  quantity: string;
  total: string;
}

export interface InvoiceRxRow {
  label: string;
  sph: string;
  cyl: string;
  axis: string;
  add: string;
}

export interface InvoiceViewModel {
  invoiceNo: string;
  invoiceDate: string;
  customerName: string;
  contactNo: string;
  productLines: InvoiceProductLine[];
  rxRows: InvoiceRxRow[];
  details: string;
  totalAmount: string;
  amountPaid: string;
  balance: string;
  user: string;
  storeName?: string;
  storeAddress?: string;
}

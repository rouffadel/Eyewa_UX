import { InvoiceRxRow, InvoiceViewModel } from '../models/invoice.models';
import { SaveSalesDetailsResult, SaveSalesDetailsRow } from '../models/save-sales.models';
import { buildInvoiceViewModel, BuildInvoiceInput } from './invoice.mapper';
import { formatMoney } from './payment.service';

interface BuildInvoiceFromSaveSalesInput {
  saveResult: SaveSalesDetailsResult;
  fallback: BuildInvoiceInput;
}

export function buildInvoiceFromSaveSalesResponse(
  input: BuildInvoiceFromSaveSalesInput,
): InvoiceViewModel {
  const fallback = buildInvoiceViewModel(input.fallback);
  const salesDetails = input.saveResult.salesDetails;
  const salesPrint = input.saveResult.salesPrint;

  if (!salesDetails) {
    return fallback;
  }

  const netTotal = salesDetails.NetTotal ?? 0;
  const balance = salesDetails.Balance ?? 0;
  const amountPaid = Math.max(0, netTotal - balance);

  return {
    invoiceNo: salesDetails.InvoiceNo || salesPrint?.InvoiceNo || fallback.invoiceNo,
    invoiceDate: salesDetails.InvoiceDate || salesPrint?.InvoiceDate || fallback.invoiceDate,
    customerName: salesDetails.CustomerName || fallback.customerName,
    contactNo: salesDetails.CustomerNo || fallback.contactNo,
    productLines: fallback.productLines,
    rxRows: buildRxRowsFromSalesDetails(salesDetails, fallback.rxRows),
    details: fallback.details,
    totalAmount: formatMoney(netTotal),
    amountPaid: formatMoney(amountPaid),
    balance: formatMoney(balance),
    user: fallback.user,
    storeName: salesPrint?.StoreName?.trim() || undefined,
    storeAddress: salesPrint?.Address?.trim() || undefined,
  };
}

function buildRxRowsFromSalesDetails(
  row: SaveSalesDetailsRow,
  fallback: InvoiceRxRow[],
): InvoiceRxRow[] {
  const hasRx = [
    row.SPH_RightEye,
    row.CYL_RightEye,
    row.AXIS_RightEye,
    row.ADD_RightEye,
    row.SPH_LeftEye,
    row.CYL_LeftEye,
    row.AXIS_LeftEye,
    row.ADD_LeftEye,
  ].some((value) => value != null && `${value}`.trim() !== '');

  if (!hasRx) {
    return fallback;
  }

  return [
    {
      label: 'Right Eye',
      sph: formatRxCell(row.SPH_RightEye),
      cyl: formatRxCell(row.CYL_RightEye),
      axis: formatRxCell(row.AXIS_RightEye),
      add: formatRxCell(row.ADD_RightEye),
    },
    {
      label: 'Left Eye',
      sph: formatRxCell(row.SPH_LeftEye),
      cyl: formatRxCell(row.CYL_LeftEye),
      axis: formatRxCell(row.AXIS_LeftEye),
      add: formatRxCell(row.ADD_LeftEye),
    },
    {
      label: 'IPD',
      sph: formatIpdCell(row.SPH_IPD),
      cyl: formatRxCell(row.CYL_IPD),
      axis: formatRxCell(row.AXIS_IPD),
      add: formatRxCell(row.ADD_IPD),
    },
  ];
}

function formatRxCell(value: string | null | undefined): string {
  if (value == null || `${value}`.trim() === '') {
    return '—';
  }

  return `${value}`.trim();
}

function formatIpdCell(value: string | null | undefined): string {
  const formatted = formatRxCell(value);
  if (formatted === '—') {
    return formatted;
  }

  return `${formatted} mc`;
}

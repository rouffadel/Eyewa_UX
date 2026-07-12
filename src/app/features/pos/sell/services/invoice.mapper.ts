import {
  calculateFrameLineTotals,
  calculateLensLineTotal,
  EyePrescription,
  PrescriptionRecord,
} from '../../prescription/models/prescription.models';
import { CartLineItem, lineTotal } from '../models/cart.models';
import { Customer, PrescriptionSummary } from '../models/customer.models';
import { InvoiceProductLine, InvoiceRxRow, InvoiceViewModel } from '../models/invoice.models';
import { PaymentDraft, PaymentTotals } from '../models/payment.models';
import { formatMoney, paymentAmountPaid, paymentBalanceRemaining } from './payment.service';

export interface BuildInvoiceInput {
  customer: Customer;
  cartItems: CartLineItem[];
  paymentTotals: PaymentTotals;
  paymentDraft: PaymentDraft;
  prescriptionRecord: PrescriptionRecord | null;
  latestPrescription: PrescriptionSummary | null;
  staffName: string;
}

export function buildInvoiceViewModel(input: BuildInvoiceInput): InvoiceViewModel {
  const payable = input.paymentTotals.payable;
  const amountPaid = paymentAmountPaid(payable, input.paymentDraft);
  const balance = paymentBalanceRemaining(payable, input.paymentDraft);
  const prescription = resolvePrescription(input.prescriptionRecord, input.latestPrescription);

  return {
    invoiceNo: resolveInvoiceNo(input.customer),
    invoiceDate: formatInvoiceDateTime(),
    customerName: input.customer.displayName,
    contactNo: input.customer.phone ?? input.customer.phoneMasked,
    productLines: buildProductLines(input.prescriptionRecord, input.cartItems),
    rxRows: buildRxRows(prescription),
    details: input.prescriptionRecord?.notes?.trim() ?? '',
    totalAmount: formatMoney(payable),
    amountPaid: formatMoney(amountPaid),
    balance: formatMoney(balance),
    user: input.staffName,
  };
}

function resolveInvoiceNo(customer: Customer): string {
  if (customer.invoiceNo?.trim()) {
    return customer.invoiceNo.trim();
  }

  const now = new Date();
  const day = `${now.getDate()}`.padStart(2, '0');
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const year = now.getFullYear();
  const suffix = `${Math.floor(10000 + Math.random() * 90000)}`;

  return `2020-${day}${month}${year}-${suffix}`;
}

function formatInvoiceDateTime(date = new Date()): string {
  const day = `${date.getDate()}`.padStart(2, '0');
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const year = date.getFullYear();
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  const seconds = `${date.getSeconds()}`.padStart(2, '0');

  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
}

function buildProductLines(
  prescriptionRecord: PrescriptionRecord | null,
  cartItems: CartLineItem[],
): InvoiceProductLine[] {
  const fromPrescription = buildProductLinesFromPrescription(prescriptionRecord);
  if (fromPrescription.length > 0) {
    return fromPrescription;
  }

  return cartItems.map((item) => ({
    category: formatCatalogCategory(item.product.category),
    brand: item.product.name,
    modelNo: item.product.sku,
    sellingPrice: formatMoney(item.unitPrice),
    quantity: String(item.qty),
    total: formatMoney(lineTotal(item)),
  }));
}

function buildProductLinesFromPrescription(
  record: PrescriptionRecord | null,
): InvoiceProductLine[] {
  if (!record) {
    return [];
  }

  const frameLines = record.frames
    .filter((line) => line.brandName.trim() || line.modelNo.trim() || line.sellingPrice !== null)
    .map((line) => {
      const totals = calculateFrameLineTotals(
        line.sellingPrice,
        line.quantity,
        line.discountPercent,
      );

      return {
        category: line.category,
        brand: line.brandName.trim() || '—',
        modelNo: line.modelNo.trim() || '—',
        sellingPrice: formatMoney(line.sellingPrice ?? 0),
        quantity: String(line.quantity),
        total: formatMoney(totals.totalSellingPrice),
      };
    });

  const lensLines = record.orderLensEnabled
    ? record.lenses
        .filter((line) => line.orderLens.trim() || line.price !== null)
        .map((line) => ({
          category: line.category,
          brand: line.orderLens.trim() || '—',
          modelNo: '—',
          sellingPrice: formatMoney(line.price ?? 0),
          quantity: String(line.quantity),
          total: formatMoney(calculateLensLineTotal(line.price, line.quantity)),
        }))
    : [];

  return [...frameLines, ...lensLines];
}

function formatCatalogCategory(category: string): string {
  switch (category) {
    case 'frames':
      return 'Frames';
    case 'lenses':
      return 'Lenses';
    case 'accessories':
      return 'Accessories';
    case 'contact-lens':
      return 'Contact Lens';
    default:
      return category;
  }
}

type ResolvedPrescription = {
  rightEye: EyePrescription | null;
  leftEye: EyePrescription | null;
  pd: string;
};

function resolvePrescription(
  record: PrescriptionRecord | null,
  summary: PrescriptionSummary | null,
): ResolvedPrescription {
  if (record) {
    return {
      rightEye: record.rightEye,
      leftEye: record.leftEye,
      pd: formatMeasurement(record.pd),
    };
  }

  if (!summary) {
    return { rightEye: null, leftEye: null, pd: '—' };
  }

  return {
    rightEye: {
      sph: parseSummaryValue(summary.od.sph),
      cyl: parseSummaryValue(summary.od.cyl),
      axis: parseSummaryValue(summary.od.axis),
      add: null,
    },
    leftEye: {
      sph: parseSummaryValue(summary.os.sph),
      cyl: parseSummaryValue(summary.os.cyl),
      axis: parseSummaryValue(summary.os.axis),
      add: null,
    },
    pd: summary.pd,
  };
}

function parseSummaryValue(value: string): number | null {
  if (!value || value === '—') {
    return null;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildRxRows(prescription: ResolvedPrescription): InvoiceRxRow[] {
  return [
    {
      label: 'Right Eye',
      sph: formatRxValue(prescription.rightEye?.sph ?? null),
      cyl: formatRxValue(prescription.rightEye?.cyl ?? null),
      axis: formatAxisValue(prescription.rightEye?.axis ?? null),
      add: formatRxValue(prescription.rightEye?.add ?? null),
    },
    {
      label: 'Left Eye',
      sph: formatRxValue(prescription.leftEye?.sph ?? null),
      cyl: formatRxValue(prescription.leftEye?.cyl ?? null),
      axis: formatAxisValue(prescription.leftEye?.axis ?? null),
      add: formatRxValue(prescription.leftEye?.add ?? null),
    },
    {
      label: 'IPD',
      sph: prescription.pd === '—' ? '—' : `${prescription.pd} mc`,
      cyl: '—',
      axis: '—',
      add: '—',
    },
  ];
}

function formatRxValue(value: number | null): string {
  if (value === null) {
    return '—';
  }

  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}`;
}

function formatAxisValue(value: number | null): string {
  if (value === null) {
    return '—';
  }

  return String(value);
}

function formatMeasurement(value: number | null): string {
  if (value === null) {
    return '—';
  }

  return value.toFixed(1);
}

import {
  EyePrescription,
  PrescriptionFrameLine,
  PrescriptionLensLine,
  PrescriptionRecord,
  parseNumericInput,
} from '../../prescription/models/prescription.models';
import { OrderLenseEyeReading, OrderLenseLine, OrderLenseOrder } from '../models/order-lense.models';
import { SalesDetailsGridLineItem, SalesDetailsGridRow } from '../models/sales-details-grid.models';
import { SalesDetailsResult } from './sales-details.service';

export interface ApiSalePrescriptionInput {
  customerId: string;
  salesId: number;
  salesResult: SalesDetailsResult;
  orderResult: OrderLenseOrder;
  existingRecord?: PrescriptionRecord | null;
}

export function prescriptionRecordFromApiSale(input: ApiSalePrescriptionInput): PrescriptionRecord {
  const { customerId, salesId, salesResult, orderResult, existingRecord } = input;
  const now = new Date().toISOString();
  const frames = mapFrames(salesResult.lineItems);
  const lenses = mapLenses(orderResult.lenses);
  const row = salesResult.row;

  return {
    id: existingRecord?.id ?? `rx-api-${salesId}-${Date.now()}`,
    customerId,
    salesId,
    orderLensEnabled: lenses.length > 0,
    frames,
    lenses,
    rightEye: buildRightEye(row, orderResult.od),
    leftEye: buildLeftEye(row, orderResult.os),
    pd: parseNumericInput(row?.sphIpd ?? null),
    nearPd: parseNumericInput(row?.addIpd ?? null),
    vd: null,
    notes: '',
    createdAt: existingRecord?.createdAt ?? now,
    updatedAt: now,
  };
}

export function hasApiSalePrescriptionData(
  salesResult: SalesDetailsResult,
  orderResult: OrderLenseOrder,
): boolean {
  return salesResult.lineItems.length > 0 || orderResult.lenses.length > 0 || salesResult.row !== null;
}

function mapFrames(lines: SalesDetailsGridLineItem[]): PrescriptionFrameLine[] {
  return lines.map((line) => ({
    category: line.categoryName,
    categoryId: line.categoryId,
    brandId: line.brandId,
    brandName: line.brandName,
    productId: line.productId,
    modelNo: line.productName,
    sellingPrice: line.sellingPrice,
    quantity: line.quantity,
    maxDiscount: line.maxDiscount,
    discountPercent: line.discountPercent,
  }));
}

function mapLenses(lines: OrderLenseLine[]): PrescriptionLensLine[] {
  return lines
    .filter((line) => line.isActive && !line.isDeleted)
    .map((line) => ({
      category: line.category,
      orderLens: line.orderLense,
      price: line.price,
      quantity: line.quantity,
    }));
}

function buildRightEye(
  row: SalesDetailsGridRow | null,
  reading: OrderLenseEyeReading | null,
): EyePrescription {
  return {
    sph: parseEyeValue(row?.sphRightEye, reading?.sph),
    cyl: parseEyeValue(row?.cylRightEye, reading?.cyl),
    axis: parseEyeValue(row?.axisRightEye, reading?.axis),
    add: parseEyeValue(row?.addRightEye, reading?.ad),
  };
}

function buildLeftEye(
  row: SalesDetailsGridRow | null,
  reading: OrderLenseEyeReading | null,
): EyePrescription {
  return {
    sph: parseEyeValue(row?.sphLeftEye, reading?.sph),
    cyl: parseEyeValue(row?.cylLeftEye, reading?.cyl),
    axis: parseEyeValue(row?.axisLeftEye, reading?.axis),
    add: parseEyeValue(row?.addLeftEye, reading?.ad),
  };
}

function parseEyeValue(
  primary: string | number | null | undefined,
  fallback: string | null | undefined,
): number | null {
  const primaryValue = parseNumericInput(primary ?? null);
  if (primaryValue !== null) {
    return primaryValue;
  }

  return parseNumericInput(fallback ?? null);
}

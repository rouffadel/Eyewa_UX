import {
  calculateLensLineTotal,
  EyePrescription,
  PrescriptionLensLine,
  PrescriptionPayload,
} from '../models/prescription.models';
import { SaveOrderLensePayload } from '../models/save-order-lense.models';

export function buildSaveOrderLensePayload(payload: PrescriptionPayload): SaveOrderLensePayload {
  if (!payload.salesId) {
    throw new Error('Sales ID is required to save prescription.');
  }

  return {
    OrderLenses: payload.lenses.map((line) => toOrderLensLine(line)),
    PrescriptionDetails: [
      toPrescriptionDetail(payload.rightEye),
      toPrescriptionDetail(payload.leftEye),
    ],
    PrescriptionIpd: toPrescriptionIpd(payload.rightEye, payload.leftEye),
    SalesId: payload.salesId,
  };
}

function toOrderLensLine(line: PrescriptionLensLine): SaveOrderLensePayload['OrderLenses'][number] {
  const price = line.price ?? 0;
  const quantity = Math.max(1, line.quantity ?? 1);

  return {
    CategoryId: line.category,
    Brand: line.orderLens,
    Price: formatPrice(price),
    Quantity: String(quantity),
    Total: calculateLensLineTotal(price, quantity),
  };
}

function toPrescriptionDetail(
  eye: EyePrescription,
): SaveOrderLensePayload['PrescriptionDetails'][number] {
  return {
    sph: formatEyePower(eye.sph),
    cyl: formatEyePower(eye.cyl),
    axis: formatAxis(eye.axis),
    add: formatAdd(eye.add),
  };
}

function toPrescriptionIpd(
  rightEye: EyePrescription,
  leftEye: EyePrescription,
): SaveOrderLensePayload['PrescriptionIpd'] {
  return {
    sphtext: toIpdFlag(rightEye.sph, leftEye.sph),
    cyltext: toIpdFlag(rightEye.cyl, leftEye.cyl),
    axistext: toIpdFlag(rightEye.axis, leftEye.axis),
    addtext: toIpdFlag(rightEye.add, leftEye.add),
  };
}

export function formatEyePower(value: number | null): string {
  if (value === null) {
    return '';
  }

  const absolute = Math.abs(value).toFixed(2);

  if (value > 0) {
    return `+${absolute}`;
  }

  if (value < 0) {
    return `-${absolute}`;
  }

  return '0.00';
}

export function formatAxis(value: number | null): string {
  if (value === null) {
    return '';
  }

  return String(Math.trunc(value));
}

export function formatAdd(value: number | null): string {
  if (value === null) {
    return '';
  }

  return value.toFixed(2);
}

function formatPrice(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function toIpdFlag(...values: Array<number | null>): string {
  return values.some((value) => value !== null) ? '1' : '0';
}

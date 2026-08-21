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

  const orderLenses = payload.lenses
    .map((line) => toOrderLensLine(line))
    .filter((line): line is SaveOrderLensePayload['OrderLenses'][number] => line !== null);

  return {
    OrderLenses: orderLenses,
    PrescriptionDetails: [
      toPrescriptionDetail(payload.rightEye),
      toPrescriptionDetail(payload.leftEye),
    ],
    PrescriptionIpd: toPrescriptionIpd(payload.rightEye, payload.leftEye, payload.pd, payload.nearPd, payload.vd),
    SalesId: payload.salesId,
  };
}

function toOrderLensLine(line: PrescriptionLensLine): SaveOrderLensePayload['OrderLenses'][number] | null {
  const price = line.price ?? 0;
  const quantity = Math.max(1, line.quantity ?? 1);
  const originalQuantity = line.originalQuantity ?? 0;
  const delta = quantity - originalQuantity;

  if (delta === 0 && line.orderLenseId) {
    return null;
  }

  return {
    OrderLenseId: line.orderLenseId ?? 0,
    CategoryId: line.category,
    Brand: line.orderLens,
    Price: formatPrice(price),
    Quantity: String(delta),
    Total: calculateLensLineTotal(price, delta),
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
  pd: number | null,
  nearPd: number | null,
  vd: number | null,
): SaveOrderLensePayload['PrescriptionIpd'] {
  return {
    sphtext: pd !== null ? String(pd) : '',
    cyltext: vd !== null ? String(vd) : '',
    axistext: '',
    addtext: nearPd !== null ? String(nearPd) : '',
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

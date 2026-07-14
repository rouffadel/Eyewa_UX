import {
  EyePrescription,
  PrescriptionRecord,
} from '../../prescription/models/prescription.models';
import { PrescriptionEyeValues, PrescriptionSummary } from '../models/customer.models';

export function hasPrescriptionSummaryRxData(summary: PrescriptionSummary): boolean {
  const values = [
    summary.od.sph,
    summary.od.cyl,
    summary.od.axis,
    summary.od.add,
    summary.os.sph,
    summary.os.cyl,
    summary.os.axis,
    summary.os.add,
    summary.pd,
    summary.nearPd,
  ];

  return values.some((value) => !isEmptyRxDisplayValue(value));
}

export function toPrescriptionSummary(record: PrescriptionRecord): PrescriptionSummary {
  return {
    date: formatDisplayDate(record.createdAt),
    doctorName: '—',
    od: formatEyeValues(record.rightEye),
    os: formatEyeValues(record.leftEye),
    pd: formatMeasurement(record.pd),
    nearPd: formatMeasurement(record.nearPd),
  };
}

export function formatPrescriptionSavedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  const day = `${date.getDate()}`.padStart(2, '0');
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;

  return `${day}-${month}-${year} at ${hour12}:${minutes} ${period}`;
}

function formatEyeValues(eye: EyePrescription): PrescriptionEyeValues {
  return {
    sph: formatRxValue(eye.sph),
    cyl: formatRxValue(eye.cyl),
    axis: eye.axis === null ? '—' : String(eye.axis),
  };
}

function formatRxValue(value: number | null): string {
  if (value === null) {
    return '—';
  }

  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}`;
}

function formatMeasurement(value: number | null): string {
  if (value === null) {
    return '—';
  }

  return value.toFixed(1);
}

function formatDisplayDate(iso: string): string {
  const date = new Date(iso);
  const day = `${date.getDate()}`.padStart(2, '0');
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

function isEmptyRxDisplayValue(value: string | undefined): boolean {
  return !value || value.trim() === '' || value.trim() === '—';
}

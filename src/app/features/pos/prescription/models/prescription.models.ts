export interface EyePrescription {
  sph: number | null;
  cyl: number | null;
  axis: number | null;
  add: number | null;
}

export interface Doctor {
  id: string;
  displayName: string;
}

export interface PrescriptionFrameLine {
  category: string;
  categoryId?: number | null;
  brandId: number | null;
  brandName: string;
  productId: number | null;
  modelNo: string;
  sellingPrice: number | null;
  quantity: number;
  maxDiscount: number | null;
  discountPercent: number | null;
  /** Existing sales line id from GetSalesDetailsGrid table1 (SalesDetailsID). */
  salesDetailsId?: number | null;
}

export interface PrescriptionFrameLineTotals {
  discountAmount: number;
  totalSellingPrice: number;
}

export interface PrescriptionLensLine {
  category: string;
  orderLens: string;
  price: number | null;
  quantity: number;
}

export interface PrescriptionFormValue {
  orderLensEnabled: boolean;
  frames: PrescriptionFrameLine[];
  lenses: PrescriptionLensLine[];
  rightEye: EyePrescription;
  leftEye: EyePrescription;
  pd: number | null;
  nearPd: number | null;
  vd: number | null;
  notes: string;
}

export interface PrescriptionPayload extends PrescriptionFormValue {
  customerId: string;
  salesId?: number;
}

export interface PrescriptionRecord extends PrescriptionPayload {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export type EyeFieldKey = keyof EyePrescription;

export const EYE_FIELD_LABELS: Record<EyeFieldKey, string> = {
  sph: 'SPH',
  cyl: 'CYL',
  axis: 'AXIS',
  add: 'ADD',
};

export function todayIsoDate(): string {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function parseNumericInput(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

export const DEFAULT_EYE_VALUE = 0;

export function createEmptyEyePrescription(): EyePrescription {
  return {
    sph: DEFAULT_EYE_VALUE,
    cyl: DEFAULT_EYE_VALUE,
    axis: DEFAULT_EYE_VALUE,
    add: DEFAULT_EYE_VALUE,
  };
}

export function normalizeEyePrescription(eye: Partial<EyePrescription>): EyePrescription {
  return {
    sph: parseNumericInput(eye.sph) ?? DEFAULT_EYE_VALUE,
    cyl: parseNumericInput(eye.cyl) ?? DEFAULT_EYE_VALUE,
    axis: parseNumericInput(eye.axis) ?? DEFAULT_EYE_VALUE,
    add: parseNumericInput(eye.add) ?? DEFAULT_EYE_VALUE,
  };
}

export interface PrescriptionLensCategoryOption {
  id: string;
  value: string;
}

export const LENS_CATEGORY_OPTIONS: readonly PrescriptionLensCategoryOption[] = [
  { id: 'CR39', value: 'CR39' },
  { id: 'Glass', value: 'Glass' },
  { id: 'CR39PC', value: 'CR39PC' },
] as const;

export const FRAME_CATEGORIES = ['Frames - P', 'Frames - S', 'Frames - U'] as const;

export function calculateFrameLineTotals(
  sellingPrice: number | null,
  quantity: number | null | undefined,
  discountPercent: number | null,
): PrescriptionFrameLineTotals {
  const price = sellingPrice ?? 0;
  const qty = Math.max(1, quantity ?? 1);
  const pct = Math.max(0, discountPercent ?? 0);
  const subtotal = price * qty;
  const discountAmount = subtotal * (pct / 100);
  const totalSellingPrice = Math.max(0, subtotal - discountAmount);

  return { discountAmount, totalSellingPrice };
}

export function calculateLensLineTotal(
  price: number | null,
  quantity: number | null | undefined,
): number {
  const unitPrice = price ?? 0;
  const qty = Math.max(1, quantity ?? 1);
  return unitPrice * qty;
}

export function createEmptyFrameLine(category: string = FRAME_CATEGORIES[0]): PrescriptionFrameLine {
  return {
    category,
    categoryId: null,
    brandId: null,
    brandName: '',
    productId: null,
    modelNo: '',
    sellingPrice: null,
    quantity: 1,
    maxDiscount: null,
    discountPercent: null,
  };
}

export function createEmptyLensLine(): PrescriptionLensLine {
  return {
    category: LENS_CATEGORY_OPTIONS[0].value,
    orderLens: '',
    price: null,
    quantity: 1,
  };
}

export function hasPrescriptionLensData(
  record: Pick<PrescriptionFormValue, 'lenses'> | Pick<PrescriptionRecord, 'lenses'>,
): boolean {
  return record.lenses.some(
    (line) => Boolean(line.orderLens?.trim()) || line.price != null,
  );
}

export function hasPrescriptionRxData(
  record: Pick<PrescriptionRecord, 'rightEye' | 'leftEye' | 'pd' | 'nearPd'>,
): boolean {
  if (record.pd !== null || record.nearPd !== null) {
    return true;
  }

  const eyes = [record.rightEye, record.leftEye];

  for (const eye of eyes) {
    if (eyeHasRxData(eye)) {
      return true;
    }
  }

  return false;
}

function eyeHasRxData(eye: EyePrescription): boolean {
  return (
    (eye.sph !== null && eye.sph !== 0) ||
    (eye.cyl !== null && eye.cyl !== 0) ||
    (eye.axis !== null && eye.axis !== 0) ||
    (eye.add !== null && eye.add !== 0)
  );
}

export function createDefaultPrescriptionFormValue(defaultFrameCategory: string = FRAME_CATEGORIES[0]): PrescriptionFormValue {
  return {
    orderLensEnabled: true,
    frames: [createEmptyFrameLine(defaultFrameCategory)],
    lenses: [createEmptyLensLine()],
    rightEye: createEmptyEyePrescription(),
    leftEye: createEmptyEyePrescription(),
    pd: null,
    nearPd: null,
    vd: null,
    notes: '',
  };
}

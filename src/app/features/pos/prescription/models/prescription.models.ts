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

export function createEmptyEyePrescription(): EyePrescription {
  return { sph: null, cyl: null, axis: null, add: null };
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

import { parseNumericInput } from '../../prescription/models/prescription.models';

export type FaceForm = 'Oval' | 'Round' | 'Square' | 'Heart' | 'Oblong';

export const FACE_FORM_OPTIONS: FaceForm[] = [
  'Oval',
  'Round',
  'Square',
  'Heart',
  'Oblong',
];

export interface MeasurementsFormValue {
  pd: number | null;
  nearPd: number | null;
  frameWidth: number | null;
  bridgeWidth: number | null;
  templeLength: number | null;
  lensHeight: number | null;
  wrapAngle: number | null;
  faceForm: FaceForm;
  frameHeight: number | null;
}

export interface MeasurementsPayload extends MeasurementsFormValue {
  customerId: string;
}

export interface MeasurementsRecord extends MeasurementsPayload {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export function createEmptyMeasurementsFormValue(): MeasurementsFormValue {
  return {
    pd: null,
    nearPd: null,
    frameWidth: null,
    bridgeWidth: null,
    templeLength: null,
    lensHeight: null,
    wrapAngle: null,
    faceForm: 'Oval',
    frameHeight: null,
  };
}

export function normalizeMeasurementsFormValue(
  value: Partial<MeasurementsFormValue>,
): MeasurementsFormValue {
  return {
    pd: parseNumericInput(value.pd),
    nearPd: parseNumericInput(value.nearPd),
    frameWidth: parseNumericInput(value.frameWidth),
    bridgeWidth: parseNumericInput(value.bridgeWidth),
    templeLength: parseNumericInput(value.templeLength),
    lensHeight: parseNumericInput(value.lensHeight),
    wrapAngle: parseNumericInput(value.wrapAngle),
    faceForm: value.faceForm ?? 'Oval',
    frameHeight: parseNumericInput(value.frameHeight),
  };
}

export { parseNumericInput };

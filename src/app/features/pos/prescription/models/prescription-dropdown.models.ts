import { EyeFieldKey } from './prescription.models';

export interface PrescriptionDropdownOption {
  label: string;
  value: number;
}

export type PrescriptionDropdowns = Record<EyeFieldKey, PrescriptionDropdownOption[]>;

export interface PrescriptionDropdownRow {
  txt?: string | number;
  val?: string | number;
}

export interface GetPrescriptionDropDownsResponse {
  status: string;
  message: string;
  objresult?: Partial<Record<Uppercase<EyeFieldKey>, PrescriptionDropdownRow[]>>;
  qrcodeimg?: string | null;
}

const DEFAULT_ZERO_OPTION: PrescriptionDropdownOption = { label: '0.00', value: 0 };

export const EMPTY_PRESCRIPTION_DROPDOWNS: PrescriptionDropdowns = {
  sph: [DEFAULT_ZERO_OPTION],
  cyl: [DEFAULT_ZERO_OPTION],
  axis: [DEFAULT_ZERO_OPTION],
  add: [DEFAULT_ZERO_OPTION],
};

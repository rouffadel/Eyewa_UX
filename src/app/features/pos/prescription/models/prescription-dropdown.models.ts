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

export const EMPTY_PRESCRIPTION_DROPDOWNS: PrescriptionDropdowns = {
  sph: [],
  cyl: [],
  axis: [],
  add: [],
};

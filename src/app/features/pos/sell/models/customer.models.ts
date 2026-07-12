export interface Customer {
  id: string;
  displayName: string;
  initials: string;
  phoneMasked: string;
  phone?: string;
  loyaltyPoints: number;
  lastVisit: string;
  invoiceNo?: string;
  salesId?: number;
}

export interface PrescriptionEyeValues {
  sph: string;
  cyl: string;
  axis: string;
  add?: string;
}

export interface PrescriptionSummary {
  date: string;
  doctorName: string;
  od: PrescriptionEyeValues;
  os: PrescriptionEyeValues;
  pd: string;
  nearPd: string;
}

export interface SavedPrescriptionListItem {
  id: string;
  summary: PrescriptionSummary;
}

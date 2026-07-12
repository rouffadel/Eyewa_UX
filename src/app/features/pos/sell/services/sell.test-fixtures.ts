import { Customer, PrescriptionSummary } from '../models/customer.models';
import { Product } from '../models/product.models';

/** Test-only customer fixture with a salesId for API save flows. */
export const TEST_CUSTOMER: Customer = {
  id: '114055',
  displayName: 'Saud Ahmed',
  initials: 'SA',
  phoneMasked: '0500000000',
  phone: '0500000000',
  loyaltyPoints: 250,
  lastVisit: '18-05-2024',
  invoiceNo: 'INV-001',
  salesId: 114055,
};

export const TEST_PRESCRIPTION: PrescriptionSummary = {
  date: '21-05-2024',
  doctorName: 'Dr. Khalid',
  od: { sph: '-1.50', cyl: '-0.75', axis: '180' },
  os: { sph: '-1.25', cyl: '-1.00', axis: '175' },
  pd: '62.0',
  nearPd: '+1.25',
};

export const TEST_PRODUCT: Product = {
  sku: 'FRM-0001',
  barcode: '8690001000001',
  name: 'Ray-Ban RB 2140',
  price: 650,
  category: 'frames',
};

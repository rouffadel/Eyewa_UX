import { buildInvoiceFromSaveSalesResponse } from './save-sales-response.mapper';
import { DEFAULT_PAYMENT_DRAFT } from '../models/payment.models';

describe('buildInvoiceFromSaveSalesResponse', () => {
  it('should map SaveSalesDetails API response into invoice view model', () => {
    const invoice = buildInvoiceFromSaveSalesResponse({
      saveResult: {
        status: '200',
        message: 'Success',
        salesDetails: {
          SaleID: 114090,
          CustomerName: 'Mounika',
          CustomerNo: '9809878789',
          GrossTotal: 450,
          Discount: 0,
          NetTotal: 450,
          Balance: 343.95,
          InvoiceNo: 'NAB-02072026-28745',
          InvoiceDate: '02-07-2026 00:00:00',
          SPH_RightEye: '+15.25',
          CYL_RightEye: '+5.25',
          AXIS_RightEye: '179',
          ADD_RightEye: '3.25',
          SPH_LeftEye: '1',
          CYL_LeftEye: '1',
          AXIS_LeftEye: '1',
          ADD_LeftEye: '1',
        },
        salesPrint: {
          StoreName: 'Naimat Al Basar',
          Address: '',
          InvoiceDate: '02-07-2026 00:00:00',
          InvoiceNo: 'NAB-02072026-28745',
          CustomerName: 'Mounika',
          CustomerNo: '9809878789',
          GrossTotal: 450,
          Discount: 0,
          NetTotal: 450,
          Name: null,
        },
        raw: {},
      },
      fallback: {
        customer: {
          id: '114090',
          displayName: 'Mounika',
          initials: 'MO',
          phoneMasked: '9809878789',
          loyaltyPoints: 0,
          lastVisit: '—',
        },
        cartItems: [],
        paymentTotals: {
          subtotal: 450,
          discount: 0,
          vat: 0,
          total: 450,
          loyaltyDeduction: 0,
          payable: 450,
        },
        paymentDraft: {
          ...DEFAULT_PAYMENT_DRAFT,
          payPartial: true,
          partialAmount: 106.05,
        },
        prescriptionRecord: null,
        latestPrescription: null,
        staffName: 'Staff User',
      },
    });

    expect(invoice.invoiceNo).toBe('NAB-02072026-28745');
    expect(invoice.customerName).toBe('Mounika');
    expect(invoice.storeName).toBe('Naimat Al Basar');
    expect(invoice.totalAmount).toBe('450.00');
    expect(invoice.balance).toBe('343.95');
    expect(invoice.amountPaid).toBe('106.05');
    expect(invoice.rxRows[0].sph).toBe('+15.25');
  });
});

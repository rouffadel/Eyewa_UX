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
        raw: {
          qrcodeimg: 'data:image/png;base64,paid-qr',
        },
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
          insuranceAmount: 0,
          insuranceCompensation: 0,
          insuranceCompensationType: null,
          payable: 450,
        },
        paymentDraft: {
          ...DEFAULT_PAYMENT_DRAFT,
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
    expect(invoice.total).toBe('450.00');
    expect(invoice.balance).toBe('343.95');
    expect(invoice.amountPaid).toBe('106.05');
    expect(invoice.rxRows[0].sph).toBe('+15.25');
    expect(invoice.qrcodeImg).toBe('data:image/png;base64,paid-qr');
  });

  it('should show previously paid and paid this time after settling balance', () => {
    const invoice = buildInvoiceFromSaveSalesResponse({
      saveResult: {
        status: '200',
        message: 'Success',
        salesDetails: {
          SaleID: 114122,
          CustomerName: 'Mounika',
          CustomerNo: '9809878789',
          GrossTotal: 480,
          Discount: 0,
          NetTotal: 480,
          Balance: 0,
          InvoiceNo: 'NAB-08072026-28763',
          InvoiceDate: '08-07-2026 00:00:00',
        },
        salesPrint: null,
        raw: {},
      },
      fallback: {
        customer: {
          id: '114122',
          displayName: 'Mounika',
          initials: 'MO',
          phoneMasked: '9809878789',
          loyaltyPoints: 0,
          lastVisit: '—',
        },
        cartItems: [],
        paymentTotals: {
          subtotal: 480,
          discount: 0,
          vat: 0,
          total: 480,
          loyaltyDeduction: 0,
          insuranceAmount: 0,
          insuranceCompensation: 0,
          insuranceCompensationType: null,
          payable: 480,
        },
        paymentDraft: {
          ...DEFAULT_PAYMENT_DRAFT,
          settleRemainingBalance: true,
          method: 'cash',
          cashAmount: 180,
          cardAmount: 0,
        },
        prescriptionRecord: null,
        latestPrescription: null,
        staffName: 'Staff User',
        orderPaymentBeforeSave: {
          grossTotal: 480,
          discount: 0,
          netTotal: 480,
          balance: 180,
          totalTax: 0,
          paidAmount: 300,
          insuranceAmount: 0,
        },
      },
    });

    expect(invoice.previouslyPaid).toBe('300.00');
    expect(invoice.paidThisTime).toBe('180.00');
    expect(invoice.amountPaid).toBe('480.00');
    expect(invoice.balance).toBe('0.00');
  });
});

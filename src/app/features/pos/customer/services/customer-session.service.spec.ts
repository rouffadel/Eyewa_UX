import { CustomerSessionService } from './customer-session.service';
import { InsertSalesPayload, InsertSalesResult } from '../models/customer-sales.models';

describe('CustomerSessionService', () => {
  let service: CustomerSessionService;

  const payload: InsertSalesPayload = {
    storeId: '1',
    customerName: 'Ahmed',
    customerNo: '8019382407',
    loginId: '1',
    invoiceNo: '',
    invoiceDate: '23-6-2026',
  };

  const result: InsertSalesResult = {
    status: 'Record Inserted Successfully.',
    message: 'Success',
    responseStatus: '200',
    id: 114045,
    invoiceNo: '2020-23062026-34663',
    customerNo: '8019382407',
  };

  beforeEach(() => {
    sessionStorage.clear();
    service = new CustomerSessionService();
  });

  it('should persist created customer to sessionStorage', () => {
    const record = service.saveFromCreate(payload, result);

    expect(record.customerName).toBe('Ahmed');
    expect(record.invoiceNo).toBe('2020-23062026-34663');
    expect(service.currentCustomer()?.salesId).toBe(114045);

    const reloaded = new CustomerSessionService();
    expect(reloaded.currentCustomer()?.customerNo).toBe('8019382407');
  });

  it('should map to sell dashboard customer', () => {
    service.saveFromCreate(payload, result);
    const customer = service.sellCustomer();

    expect(customer?.displayName).toBe('Ahmed');
    expect(customer?.phoneMasked).toBe('8019382407');
    expect(customer?.invoiceNo).toBe('2020-23062026-34663');
    expect(customer?.salesId).toBe(114045);
  });

  it('should clear session', () => {
    service.saveFromCreate(payload, result);
    service.clear();

    expect(service.currentCustomer()).toBeNull();
    expect(sessionStorage.getItem('eyewa_customer_session')).toBeNull();
  });
});

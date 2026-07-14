import { prescriptionRecordFromApiSale } from './api-sale-prescription.mapper';
import { SalesDetailsResult } from './sales-details.service';
import { OrderLenseOrder } from '../models/order-lense.models';

describe('prescriptionRecordFromApiSale', () => {
  it('should map sales frames and order lenses into a prescription record', () => {
    const salesResult: SalesDetailsResult = {
      salesId: 114122,
      row: {
        saleId: 114122,
        customerName: 'ishaq shaik',
        customerNo: '8886453629',
        invoiceNo: 'NAB-08072026-28763',
        invoiceDate: '2026-07-08',
        sphRightEye: '+15.25',
        cylRightEye: '+5.25',
        axisRightEye: '177',
        addRightEye: '3.00',
        sphLeftEye: '1',
        cylLeftEye: '1',
        axisLeftEye: '1',
        addLeftEye: '1',
        sphIpd: null,
        cylIpd: null,
        axisIpd: null,
        addIpd: null,
        grossTotal: 480,
        discount: 0,
        netTotal: 480,
        balance: 180,
        totalTax: 0,
      },
      prescription: null,
      lineItems: [
        {
          salesDetailsId: 107386,
          categoryName: 'Sunglasses - M',
          categoryId: 6,
          brandId: 290,
          productId: 12,
          brandName: 'B0NO',
          productName: 'BNS1078',
          sellingPrice: 480,
          productValue: 480,
          quantity: 1,
          maxDiscount: 75,
          discountPercent: 0,
          tax: 0,
          taxPercent: 0,
        },
      ],
      payment: null,
      qrcodeImg: null,
    };

    const orderResult: OrderLenseOrder = {
      salesId: 114122,
      lenses: [
        {
          orderLenseId: 65368,
          salesId: 114122,
          category: 'CR39',
          orderLense: 'test',
          price: 100,
          quantity: 2,
          total: 200,
          isActive: true,
          isDeleted: false,
          createdDate: '2026-07-08T21:44:40.853',
        },
      ],
      od: { sph: '+15.25', cyl: '+5.25', axis: '177', ad: '3.00' },
      os: null,
      additional: null,
    };

    const record = prescriptionRecordFromApiSale({
      customerId: '114122',
      salesId: 114122,
      salesResult,
      orderResult,
    });

    expect(record.frames.length).toBe(1);
    expect(record.frames[0].brandName).toBe('B0NO');
    expect(record.frames[0].productId).toBe(12);
    expect(record.frames[0].salesDetailsId).toBe(107386);
    expect(record.lenses.length).toBe(1);
    expect(record.lenses[0].orderLens).toBe('test');
    expect(record.rightEye.sph).toBe(15.25);
    expect(record.leftEye.sph).toBe(1);
    expect(record.salesId).toBe(114122);
  });
});

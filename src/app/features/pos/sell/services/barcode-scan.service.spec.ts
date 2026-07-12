import { TestBed } from '@angular/core/testing';
import {
  CapacitorBarcodeScanner,
  CapacitorBarcodeScannerTypeHint,
} from '@capacitor/barcode-scanner';
import { BarcodeScanService } from './barcode-scan.service';

describe('BarcodeScanService', () => {
  let service: BarcodeScanService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BarcodeScanService);
  });

  it('should return trimmed scan result', async () => {
    spyOn(CapacitorBarcodeScanner, 'scanBarcode').and.resolveTo({
      ScanResult: ' 8690001000001 ',
      format: CapacitorBarcodeScannerTypeHint.ALL,
    });

    await expectAsync(service.scanBarcode()).toBeResolvedTo('8690001000001');
  });

  it('should return null when scan is cancelled', async () => {
    spyOn(CapacitorBarcodeScanner, 'scanBarcode').and.rejectWith(new Error('User cancelled scan'));

    await expectAsync(service.scanBarcode()).toBeResolvedTo(null);
  });

  it('should rethrow unexpected scan errors', async () => {
    spyOn(CapacitorBarcodeScanner, 'scanBarcode').and.rejectWith(new Error('Camera unavailable'));

    await expectAsync(service.scanBarcode()).toBeRejectedWithError('Camera unavailable');
  });
});

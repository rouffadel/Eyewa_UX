import { Injectable } from '@angular/core';
import {
  CapacitorBarcodeScanner,
  CapacitorBarcodeScannerTypeHint,
} from '@capacitor/barcode-scanner';

@Injectable({ providedIn: 'root' })
export class BarcodeScanService {
  async scanBarcode(): Promise<string | null> {
    try {
      const result = await CapacitorBarcodeScanner.scanBarcode({
        hint: CapacitorBarcodeScannerTypeHint.ALL,
        scanInstructions: 'Point the camera at a product barcode',
      });

      const value = result.ScanResult?.trim();
      return value || null;
    } catch (error) {
      if (this.isCancelled(error)) {
        return null;
      }

      throw error;
    }
  }

  private isCancelled(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const message = 'message' in error ? String((error as { message?: unknown }).message) : '';
    return /cancel/i.test(message);
  }
}

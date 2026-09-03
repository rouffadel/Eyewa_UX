import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppConfigService } from '../../../../services/app-config.service';
import { firstValueFrom } from 'rxjs';

export interface TaxOption {
  taxId: number;
  taxName: string;
  taxCode: string;
  taxRate: number;
  isDefault: boolean;
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class TaxService {
  private readonly http = inject(HttpClient);
  private readonly appConfig = inject(AppConfigService);

  async getDefaultTaxRate(): Promise<number> {
    const settings = this.appConfig.settings;
    const apiUrl = settings?.apiUrl?.replace(/\/$/, '') || 'https://localhost:44357/api';

    try {
      const taxes = await firstValueFrom(this.http.get<TaxOption[]>(`${apiUrl}/Taxes`));
      if (taxes && taxes.length > 0) {
        const defaultTax = taxes.find(t => t.isDefault && t.isActive) || taxes.find(t => t.isActive) || taxes[0];
        if (defaultTax && typeof defaultTax.taxRate === 'number') {
          // taxRate is stored as percentage e.g. 15.00 => convert to decimal 0.15
          return defaultTax.taxRate > 1 ? defaultTax.taxRate / 100 : defaultTax.taxRate;
        }
      }
    } catch {
      // Fallback if API endpoint is unreachable or table empty
    }

    return settings?.vatRate ?? 0.15;
  }
}

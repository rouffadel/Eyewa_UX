import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppConfigService } from './app-config.service';

export interface CompanyConfig {
  companyName: string;
  companyLogoUrl?: string;
  companyLogoBase64?: string;
  appTitle?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CompanyBrandingService {
  private readonly http = inject(HttpClient);
  private readonly appConfig = inject(AppConfigService);

  readonly companyName = signal<string>('Eyewa');
  readonly companyLogo = signal<string>('/naimat-al-basar-logo.jpg');

  constructor() {
    this.loadBranding();
  }

  loadBranding(): void {
    const settings = this.appConfig.settings;
    const baseUrl = settings?.apiUrl?.replace(/\/$/, '') || 'https://localhost:44357/api';
    const adminApiUrl = `${baseUrl}/configurations/company`;
    this.http.get<CompanyConfig>(adminApiUrl).subscribe({
      next: (config) => {
        if (config) {
          if (config.companyName) {
            this.companyName.set(config.companyName);
          }
          const logo = config.companyLogoBase64 || config.companyLogoUrl;
          if (logo) {
            this.companyLogo.set(logo);
          }
        }
      },
      error: () => {
        // Fallback to default
      },
    });
  }
}

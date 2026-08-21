import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppConfigService } from '../../../../services/app-config.service';

@Injectable({ providedIn: 'root' })
export class OfferService {
  constructor(
    private readonly http: HttpClient,
    private readonly appConfig: AppConfigService,
  ) {}

  getActiveOffers(): Promise<any[]> {
    const settings = this.appConfig.settings;
    const apiUrl = settings?.apiUrl?.replace(/\/$/, '') || 'https://localhost:44314/api';

    return firstValueFrom(this.http.get<any>(`${apiUrl}/offers/active`))
      .then((response) => {
        if (response && response.status === '200') {
          return response.objresult || [];
        }
        return [];
      })
      .catch((error: unknown) => {
        console.error('Failed to load active offers', error);
        return [];
      });
  }
}

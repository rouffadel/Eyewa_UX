import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppConfigService } from '../../../../services/app-config.service';
import {
  GetAllInsuranceCompaniesResponse,
  GetInsuranceBySalesIdResponse,
  InsuranceCompanyOption,
  normalizeInsuranceCompanyOption,
  normalizeSalesInsuranceRow,
  SalesInsuranceRecord,
  SaveSalesInsurancePayload,
  SaveSalesInsuranceResponse,
} from '../models/insurance.models';

@Injectable({ providedIn: 'root' })
export class InsuranceService {
  constructor(
    private readonly http: HttpClient,
    private readonly appConfig: AppConfigService,
  ) {}

  getAllInsuranceCompanies(): Promise<InsuranceCompanyOption[]> {
    let url: string;

    try {
      url = this.buildGetAllCompaniesUrl();
    } catch (error) {
      return Promise.reject(this.toError(error, 'companies'));
    }

    return firstValueFrom(this.http.get<GetAllInsuranceCompaniesResponse>(url))
      .then((response) => this.mapCompaniesResponse(response))
      .catch((error: unknown) => {
        throw this.toError(error, 'companies');
      });
  }

  getInsuranceBySalesId(salesId: number): Promise<SalesInsuranceRecord | null> {
    let url: string;

    try {
      url = this.buildGetBySalesIdUrl(salesId);
    } catch (error) {
      return Promise.reject(this.toError(error, 'load'));
    }

    return firstValueFrom(this.http.get<GetInsuranceBySalesIdResponse>(url))
      .then((response) => this.mapGetBySalesIdResponse(response))
      .catch((error: unknown) => {
        throw this.toError(error, 'load');
      });
  }

  saveSalesInsurance(payload: SaveSalesInsurancePayload): Promise<void> {
    let url: string;

    try {
      url = this.buildSaveUrl();
    } catch (error) {
      return Promise.reject(this.toError(error, 'save'));
    }

    return firstValueFrom(this.http.post<SaveSalesInsuranceResponse>(url, payload))
      .then((response) => this.mapSaveResponse(response))
      .catch((error: unknown) => {
        throw this.toError(error, 'save');
      });
  }

  private buildGetAllCompaniesUrl(): string {
    const settings = this.appConfig.settings;
    const apiUrl = settings?.apiUrl?.replace(/\/$/, '');
    const path = settings?.getAllInsuranceCompaniesPath ?? 'insurance/GetAllInsuranceCompanies';

    if (!apiUrl) {
      throw new Error('Insurance companies lookup is not configured.');
    }

    return `${apiUrl}/${path}`;
  }

  private buildGetBySalesIdUrl(salesId: number): string {
    const settings = this.appConfig.settings;
    const apiUrl = settings?.apiUrl?.replace(/\/$/, '');
    const path = settings?.getInsuranceBySalesIdPath ?? 'insurance/GetInsuranceBySalesId';

    if (!apiUrl) {
      throw new Error('Insurance lookup is not configured.');
    }

    const params = new URLSearchParams({
      salesId: String(salesId),
    });

    return `${apiUrl}/${path}?${params.toString()}`;
  }

  private buildSaveUrl(): string {
    const settings = this.appConfig.settings;
    const apiUrl = settings?.apiUrl?.replace(/\/$/, '');
    const path = settings?.saveSalesInsurancePath ?? 'insurance/SaveSalesInsurance';

    if (!apiUrl) {
      throw new Error('Insurance save is not configured.');
    }

    return `${apiUrl}/${path}`;
  }

  private mapCompaniesResponse(
    response: GetAllInsuranceCompaniesResponse,
  ): InsuranceCompanyOption[] {
    if (response.status && response.status !== '200') {
      throw new Error(response.message || 'Unable to load insurance companies. Please try again.');
    }

    return (response.objresult ?? [])
      .map((row) => normalizeInsuranceCompanyOption(row))
      .filter((option): option is InsuranceCompanyOption => option !== null);
  }

  private mapGetBySalesIdResponse(
    response: GetInsuranceBySalesIdResponse,
  ): SalesInsuranceRecord | null {
    if (response.status && response.status !== '200') {
      throw new Error(response.message || 'Unable to load insurance. Please try again.');
    }

    const rows = response.objresult ?? [];
    const active = rows
      .map((row) => normalizeSalesInsuranceRow(row))
      .filter((row): row is SalesInsuranceRecord => row !== null)
      .find((row) => row.isActive);

    return active ?? null;
  }

  private mapSaveResponse(response: SaveSalesInsuranceResponse): void {
    if (response.status && response.status !== '200') {
      throw new Error(response.message || 'Unable to save insurance. Please try again.');
    }
  }

  private toError(error: unknown, action: 'load' | 'save' | 'companies'): Error {
    const fallback =
      action === 'save'
        ? 'Unable to save insurance. Please try again.'
        : action === 'companies'
          ? 'Unable to load insurance companies. Please try again.'
          : 'Unable to load insurance. Please try again.';

    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return new Error('Unable to reach the server. Check your connection and try again.');
      }

      const apiMessage =
        typeof error.error?.message === 'string' ? error.error.message.trim() : '';
      return new Error(apiMessage || fallback);
    }

    if (error instanceof Error) {
      return error;
    }

    return new Error(fallback);
  }
}

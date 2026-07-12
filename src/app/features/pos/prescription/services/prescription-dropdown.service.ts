import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppConfigService } from '../../../../services/app-config.service';
import { parseNumericInput } from '../models/prescription.models';
import {
  GetPrescriptionDropDownsResponse,
  PrescriptionDropdownOption,
  PrescriptionDropdownRow,
  PrescriptionDropdowns,
} from '../models/prescription-dropdown.models';

@Injectable({ providedIn: 'root' })
export class PrescriptionDropdownService {
  constructor(
    private readonly http: HttpClient,
    private readonly appConfig: AppConfigService,
  ) {}

  getDropdowns(): Promise<PrescriptionDropdowns> {
    const url = this.buildUrl();

    return firstValueFrom(this.http.get<GetPrescriptionDropDownsResponse>(url))
      .then((response) => this.mapResponse(response))
      .catch((error: unknown) => {
        throw this.toError(error);
      });
  }

  private buildUrl(): string {
    const settings = this.appConfig.settings;
    const apiUrl = settings?.apiUrl?.replace(/\/$/, '');
    const getPrescriptionDropDownsPath =
      settings?.getPrescriptionDropDownsPath ?? 'prescriptions/GetPrescriptionDropDowns';

    if (!apiUrl) {
      throw new Error('Prescription dropdown lookup is not configured.');
    }

    return `${apiUrl}/${getPrescriptionDropDownsPath}`;
  }

  private mapResponse(response: GetPrescriptionDropDownsResponse): PrescriptionDropdowns {
    if (response.status && response.status !== '200') {
      throw new Error(response.message || 'Unable to load prescription dropdowns.');
    }

    const objresult = response.objresult ?? {};

    return {
      sph: this.mapFieldOptions(objresult.SPH),
      cyl: this.mapFieldOptions(objresult.CYL),
      axis: this.mapFieldOptions(objresult.AXIS),
      add: this.mapFieldOptions(objresult.ADD),
    };
  }

  private mapFieldOptions(rows: PrescriptionDropdownRow[] | undefined): PrescriptionDropdownOption[] {
    if (!rows?.length) {
      return [];
    }

    return rows
      .map((row) => this.toOption(row))
      .filter((option): option is PrescriptionDropdownOption => option !== null);
  }

  private toOption(row: PrescriptionDropdownRow): PrescriptionDropdownOption | null {
    const value = parseNumericInput(row.val ?? row.txt);
    const label = String(row.txt ?? row.val ?? '').trim();

    if (value === null || !label) {
      return null;
    }

    return { label, value };
  }

  private toError(error: unknown): Error {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return new Error('Unable to reach the server. Check your connection and try again.');
      }

      return new Error('Unable to load prescription dropdowns. Please try again.');
    }

    if (error instanceof Error) {
      return error;
    }

    return new Error('Unable to load prescription dropdowns. Please try again.');
  }
}

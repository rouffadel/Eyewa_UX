import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppConfigService } from '../../../../services/app-config.service';
import {
  Doctor,
  PrescriptionPayload,
  PrescriptionRecord,
} from '../models/prescription.models';
import {
  SaveOrderLenseObjResult,
  SaveOrderLenseResponse,
  SaveOrderLenseResult,
  SaveOrderLenseRow,
} from '../models/save-order-lense.models';
import { buildSaveOrderLensePayload } from './save-order-lense.mapper';

@Injectable({ providedIn: 'root' })
export class PrescriptionService {
  private lastSaved: PrescriptionRecord | null = null;

  constructor(
    private readonly appConfig: AppConfigService,
    private readonly http: HttpClient,
  ) {}

  getDoctors(): Promise<Doctor[]> {
    const apiUrl = this.appConfig.settings?.apiUrl;
    return fetch(`${apiUrl}/doctors`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Failed to load doctors');
        }

        const data = await response.json();
        return (data.items ?? data) as Doctor[];
      });
  }

  save(payload: PrescriptionFormPayload): Promise<PrescriptionRecord> {
    if (!payload.customerId) {
      return Promise.reject(new Error('Customer is required to save prescription.'));
    }

    if (!payload.salesId) {
      return Promise.reject(new Error('Sales ID is required to save prescription.'));
    }

    const fullPayload: PrescriptionPayload = {
      ...payload,
      customerId: payload.customerId,
    };

    return this.apiSave(fullPayload);
  }

  print(prescriptionId: string): Promise<void> {
    const apiUrl = this.appConfig.settings?.apiUrl;
    return fetch(`${apiUrl}/prescriptions/${prescriptionId}/print`).then((response) => {
      if (!response.ok) {
        throw new Error('Failed to load print preview');
      }
    });
  }

  getLastSaved(): PrescriptionRecord | null {
    return this.lastSaved;
  }

  requiresSalesId(): boolean {
    return true;
  }

  private apiSave(payload: PrescriptionPayload): Promise<PrescriptionRecord> {
    const requestBody = buildSaveOrderLensePayload(payload);

    return firstValueFrom(
      this.http.post<SaveOrderLenseResponse>(this.buildSaveOrderLenseUrl(), requestBody),
    )
      .then((response) => this.toPrescriptionRecord(payload, this.mapSaveOrderLenseResponse(response)))
      .catch((error: unknown) => {
        throw this.toSaveError(error);
      });
  }

  private buildSaveOrderLenseUrl(): string {
    const settings = this.appConfig.settings;
    const apiUrl = settings?.apiUrl?.replace(/\/$/, '');
    const saveOrderLensePath = settings?.saveOrderLensePath ?? 'prescriptions/SaveOrderLense';

    if (!apiUrl) {
      throw new Error('Prescription save is not configured.');
    }

    return `${apiUrl}/${saveOrderLensePath}`;
  }

  private mapSaveOrderLenseResponse(response: SaveOrderLenseResponse): SaveOrderLenseResult {
    if (response.status && response.status !== '200') {
      throw new Error(response.message || 'Failed to save prescription.');
    }

    const row = this.extractRows(response.objresult)[0];
    const responseStatus = row?.status ?? row?.Status ?? response.message;
    const id = row?.id ?? row?.ID ?? 0;

    return {
      status: responseStatus || 'Success',
      message: response.message,
      responseStatus: response.status,
      id,
      invoiceNo: row?.invoiceNo ?? row?.InvoiceNo ?? '',
      customerNo: row?.customerNo ?? row?.CustomerNo ?? '',
    };
  }

  private extractRows(objresult: SaveOrderLenseObjResult | undefined): SaveOrderLenseRow[] {
    if (!objresult) {
      return [];
    }

    if (Array.isArray(objresult)) {
      return objresult;
    }

    return objresult.table ?? [];
  }

  private toPrescriptionRecord(
    payload: PrescriptionPayload,
    result: SaveOrderLenseResult,
  ): PrescriptionRecord {
    const now = new Date().toISOString();
    const record: PrescriptionRecord = {
      ...payload,
      id: String(result.id || payload.salesId),
      createdAt: now,
      updatedAt: now,
    };

    this.lastSaved = record;
    return record;
  }

  private toSaveError(error: unknown): Error {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return new Error('Unable to reach the server. Check your connection and try again.');
      }

      return new Error('Failed to save prescription.');
    }

    if (error instanceof Error) {
      return error;
    }

    return new Error('Failed to save prescription.');
  }
}

type PrescriptionFormPayload = Omit<PrescriptionPayload, 'customerId'> & {
  customerId?: string;
};

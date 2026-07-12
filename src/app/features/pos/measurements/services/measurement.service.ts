import { Injectable } from '@angular/core';
import { AppConfigService } from '../../../../services/app-config.service';
import {
  MeasurementsFormValue,
  MeasurementsPayload,
  MeasurementsRecord,
  normalizeMeasurementsFormValue,
} from '../models/measurements.models';

@Injectable({ providedIn: 'root' })
export class MeasurementService {
  constructor(private readonly appConfig: AppConfigService) {}

  getLatest(customerId: string): Promise<MeasurementsRecord | null> {
    if (!customerId) {
      return Promise.resolve(null);
    }

    const apiUrl = this.appConfig.settings?.apiUrl;
    return fetch(`${apiUrl}/customers/${customerId}/measurements/latest`)
      .then(async (response) => {
        if (response.status === 404) {
          return null;
        }

        if (!response.ok) {
          throw new Error('Failed to load measurements');
        }

        return (await response.json()) as MeasurementsRecord;
      });
  }

  save(
    payload: MeasurementsFormPayload,
    existingId?: string | null,
  ): Promise<MeasurementsRecord> {
    if (!payload.customerId) {
      return Promise.reject(new Error('Customer is required to save measurements.'));
    }

    const normalized = normalizeMeasurementsFormValue(payload);
    const fullPayload: MeasurementsPayload = {
      ...normalized,
      customerId: payload.customerId,
    };

    if (existingId) {
      return this.apiUpdate(existingId, fullPayload);
    }

    return this.apiCreate(fullPayload);
  }

  private apiCreate(payload: MeasurementsPayload): Promise<MeasurementsRecord> {
    const apiUrl = this.appConfig.settings?.apiUrl;
    return fetch(`${apiUrl}/measurements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(async (response) => {
      if (!response.ok) {
        throw new Error('Failed to save measurements');
      }

      return (await response.json()) as MeasurementsRecord;
    });
  }

  private apiUpdate(id: string, payload: MeasurementsPayload): Promise<MeasurementsRecord> {
    const apiUrl = this.appConfig.settings?.apiUrl;
    return fetch(`${apiUrl}/measurements/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(async (response) => {
      if (!response.ok) {
        throw new Error('Failed to update measurements');
      }

      return (await response.json()) as MeasurementsRecord;
    });
  }
}

type MeasurementsFormPayload = MeasurementsFormValue & {
  customerId?: string;
};

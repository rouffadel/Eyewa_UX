import { Injectable } from '@angular/core';
import { PrescriptionPayload, PrescriptionRecord } from '../models/prescription.models';

const STORAGE_KEY = 'eyewa_prescriptions_by_customer';

type PrescriptionStore = Record<string, PrescriptionRecord[]>;

@Injectable({ providedIn: 'root' })
export class PrescriptionLocalStorageService {
  private lastSaved: PrescriptionRecord | null = null;

  save(payload: PrescriptionPayload): PrescriptionRecord {
    const now = new Date().toISOString();
    const record: PrescriptionRecord = {
      ...payload,
      id: `rx-local-${payload.customerId}-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };

    return this.persistRecord(record);
  }

  saveRecord(record: PrescriptionRecord): PrescriptionRecord {
    return this.persistRecord(record);
  }

  getLatest(customerId: string): PrescriptionRecord | null {
    const records = this.getHistory(customerId);
    return records[0] ?? null;
  }

  getById(customerId: string, prescriptionId: string): PrescriptionRecord | null {
    const records = this.getHistory(customerId);
    const direct = records.find((entry) => entry.id === prescriptionId);
    if (direct) {
      return direct;
    }

    if (prescriptionId.startsWith('sales-')) {
      const salesId = Number.parseInt(prescriptionId.slice('sales-'.length), 10);
      if (Number.isFinite(salesId)) {
        return records.find((entry) => entry.salesId === salesId) ?? null;
      }
    }

    return null;
  }

  getHistory(customerId: string): PrescriptionRecord[] {
    return this.readStore()[customerId] ?? [];
  }

  getLastSaved(): PrescriptionRecord | null {
    return this.lastSaved;
  }

  removeForCustomer(customerId: string): void {
    const store = this.readStore();

    if (!store[customerId]) {
      if (this.lastSaved?.customerId === customerId) {
        this.lastSaved = null;
      }
      return;
    }

    delete store[customerId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));

    if (this.lastSaved?.customerId === customerId) {
      this.lastSaved = null;
    }
  }

  private persistRecord(record: PrescriptionRecord): PrescriptionRecord {
    const store = this.readStore();
    const existing = store[record.customerId] ?? [];
    const withoutDuplicate = existing.filter((entry) => entry.id !== record.id);

    store[record.customerId] = [record, ...withoutDuplicate];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    this.lastSaved = record;

    return record;
  }

  private readStore(): PrescriptionStore {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return {};
    }

    try {
      return JSON.parse(raw) as PrescriptionStore;
    } catch {
      return {};
    }
  }
}

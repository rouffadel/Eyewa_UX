import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Customer } from '../sell/models/customer.models';
import { SellSessionStore } from '../sell/services/sell-session.store';
import {
  buildSaveSalesInsurancePayload,
  InsuranceCompanyOption,
  InsuranceFormValue,
  SalesInsuranceRecord,
  toDateInputValue,
} from './models/insurance.models';
import { InsuranceService } from './services/insurance.service';

type StatusTone = 'info' | 'success' | 'error';

@Component({
  selector: 'app-insurance-form',
  imports: [ReactiveFormsModule],
  templateUrl: './insurance-form.component.html',
  styleUrl: './insurance-form.component.css',
})
export class InsuranceFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly sellStore = inject(SellSessionStore);
  private readonly insuranceService = inject(InsuranceService);

  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly successMessage = signal('');
  protected readonly errorMessage = signal('');
  protected readonly infoMessage = signal('');
  protected readonly loadedRecord = signal<SalesInsuranceRecord | null>(null);
  protected readonly insuranceCompanies = signal<readonly InsuranceCompanyOption[]>([]);

  protected readonly selectedCustomer = computed(() => this.sellStore.selectedCustomer());

  protected readonly statusText = computed(() => {
    if (this.isLoading()) {
      return 'Loading insurance…';
    }

    return this.errorMessage() || this.successMessage() || this.infoMessage();
  });

  protected readonly statusTone = computed<StatusTone>(() => {
    if (this.errorMessage()) {
      return 'error';
    }

    if (this.successMessage()) {
      return 'success';
    }

    return 'info';
  });

  protected readonly form = this.fb.group({
    insuranceCompanyId: [null as number | null, Validators.required],
    policyNumber: ['', Validators.required],
    discountPercentage: [null as number | null, Validators.required],
    validityEndDate: ['', Validators.required],
  });

  constructor() {
    effect(() => {
      const customer = this.selectedCustomer();
      void this.loadInsuranceForCustomer(customer);
    });
  }

  ngOnInit(): void {
    void this.loadInsuranceCompanies();
  }

  protected async onSave(): Promise<void> {
    this.clearMessages();
    this.form.markAllAsTouched();

    const customer = this.selectedCustomer();
    if (!customer) {
      this.errorMessage.set('Select a customer from the header before saving insurance.');
      return;
    }

    if (customer.salesId == null) {
      this.errorMessage.set('Selected customer does not have a sales ID.');
      return;
    }

    if (this.form.invalid) {
      this.errorMessage.set('Fill in all insurance fields before saving.');
      return;
    }

    const value = this.form.getRawValue() as InsuranceFormValue;
    this.isSaving.set(true);

    try {
      const payload = buildSaveSalesInsurancePayload(customer.salesId, value);
      await this.insuranceService.saveSalesInsurance(payload);

      const refreshed = await this.insuranceService.getInsuranceBySalesId(customer.salesId);
      this.loadedRecord.set(refreshed);

      if (refreshed) {
        this.ensureCompanyOption(refreshed.insuranceCompanyId, refreshed.insuranceCompanyName);
        this.applyRecord(refreshed);
      } else {
        this.form.markAsPristine();
      }

      this.successMessage.set('Insurance saved');
    } catch (error: unknown) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Unable to save insurance. Please try again.',
      );
    } finally {
      this.isSaving.set(false);
    }
  }

  protected onReset(): void {
    const record = this.loadedRecord();
    if (record) {
      this.applyRecord(record);
    } else {
      this.resetFormFields();
    }
    this.clearMessages();
  }

  private async loadInsuranceCompanies(): Promise<void> {
    try {
      const companies = await this.insuranceService.getAllInsuranceCompanies();
      this.insuranceCompanies.set(companies);
    } catch (error: unknown) {
      this.errorMessage.set(
        error instanceof Error
          ? error.message
          : 'Unable to load insurance companies. Please try again.',
      );
    }
  }

  private async loadInsuranceForCustomer(customer: Customer | null): Promise<void> {
    this.clearMessages();
    this.loadedRecord.set(null);

    if (!customer?.salesId) {
      this.resetFormFields();
      return;
    }

    this.isLoading.set(true);

    try {
      const record = await this.insuranceService.getInsuranceBySalesId(customer.salesId);
      this.loadedRecord.set(record);

      if (record) {
        this.ensureCompanyOption(record.insuranceCompanyId, record.insuranceCompanyName);
        this.applyRecord(record);
      } else {
        this.resetFormFields();
        this.infoMessage.set('No insurance on file for this sale. Enter details to save.');
      }
    } catch (error: unknown) {
      this.resetFormFields();
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Unable to load insurance. Please try again.',
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  private applyRecord(record: SalesInsuranceRecord): void {
    this.form.reset({
      insuranceCompanyId: record.insuranceCompanyId,
      policyNumber: record.policyNumber,
      discountPercentage: record.discountPercentage,
      validityEndDate: toDateInputValue(record.validityEndDate),
    });
    this.form.markAsPristine();
  }

  /** Keeps saved company selectable if it is missing from the master list. */
  private ensureCompanyOption(id: number, name: string): void {
    const existing = this.insuranceCompanies();
    if (existing.some((company) => company.id === id)) {
      return;
    }

    const label = name.trim() || `Company #${id}`;
    this.insuranceCompanies.set([{ id, name: label }, ...existing]);
  }

  private resetFormFields(): void {
    this.form.reset({
      insuranceCompanyId: null,
      policyNumber: '',
      discountPercentage: null,
      validityEndDate: '',
    });
  }

  private clearMessages(): void {
    this.successMessage.set('');
    this.errorMessage.set('');
    this.infoMessage.set('');
  }
}

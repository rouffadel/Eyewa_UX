import { Component, computed, effect, ElementRef, HostListener, inject, OnInit, signal } from '@angular/core';
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

  private readonly elementRef = inject(ElementRef);
  protected readonly isOpen = signal(false);

  protected readonly isStartDateOpen = signal(false);
  protected readonly isEndDateOpen = signal(false);
  protected readonly startOpenUpward = signal(false);
  protected readonly endOpenUpward = signal(false);
  protected readonly startYear = signal(new Date().getFullYear());
  protected readonly startMonth = signal(new Date().getMonth());
  protected readonly endYear = signal(new Date().getFullYear());
  protected readonly endMonth = signal(new Date().getMonth());

  protected readonly MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  protected getCalendarDays(year: number, month: number): Date[] {
    const date = new Date(year, month, 1);
    const days: Date[] = [];
    const startDay = date.getDay();
    const current = new Date(year, month, 1 - startDay);
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  }

  protected prevMonth(type: 'start' | 'end'): void {
    if (type === 'start') {
      if (this.startMonth() === 0) {
        this.startMonth.set(11);
        this.startYear.update((y) => y - 1);
      } else {
        this.startMonth.update((m) => m - 1);
      }
    } else {
      if (this.endMonth() === 0) {
        this.endMonth.set(11);
        this.endYear.update((y) => y - 1);
      } else {
        this.endMonth.update((m) => m - 1);
      }
    }
  }

  protected nextMonth(type: 'start' | 'end'): void {
    if (type === 'start') {
      if (this.startMonth() === 11) {
        this.startMonth.set(0);
        this.startYear.update((y) => y + 1);
      } else {
        this.startMonth.update((m) => m + 1);
      }
    } else {
      if (this.endMonth() === 11) {
        this.endMonth.set(0);
        this.endYear.update((y) => y + 1);
      } else {
        this.endMonth.update((m) => m + 1);
      }
    }
  }

  protected selectDate(type: 'start' | 'end', date: Date): void {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    const dateString = localDate.toISOString().split('T')[0];

    if (type === 'start') {
      this.form.get('validityStartDate')?.setValue(dateString);
      this.form.get('validityStartDate')?.markAsDirty();
      this.isStartDateOpen.set(false);
    } else {
      this.form.get('validityEndDate')?.setValue(dateString);
      this.form.get('validityEndDate')?.markAsDirty();
      this.isEndDateOpen.set(false);
    }
  }

  protected getFormattedDate(type: 'start' | 'end'): string {
    const val = this.form.get(type === 'start' ? 'validityStartDate' : 'validityEndDate')?.value;
    if (!val) return 'mm/dd/yyyy';
    const parts = val.split('-');
    if (parts.length === 3) {
      return `${parts[1]}/${parts[2]}/${parts[0]}`;
    }
    return val;
  }

  protected toggleCalendar(type: 'start' | 'end', event: Event): void {
    event.stopPropagation();
    const trigger = event.currentTarget as HTMLElement;
    const rect = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const calendarHeight = 330;
    const shouldOpenUpward = spaceBelow < calendarHeight;

    if (type === 'start') {
      this.startOpenUpward.set(shouldOpenUpward);
      this.isStartDateOpen.update((v) => !v);
      this.isEndDateOpen.set(false);
      const val = this.form.get('validityStartDate')?.value;
      if (val) {
        const parts = val.split('-');
        if (parts.length === 3) {
          this.startYear.set(parseInt(parts[0], 10));
          this.startMonth.set(parseInt(parts[1], 10) - 1);
        }
      }
    } else {
      this.endOpenUpward.set(shouldOpenUpward);
      this.isEndDateOpen.update((v) => !v);
      this.isStartDateOpen.set(false);
      const val = this.form.get('validityEndDate')?.value;
      if (val) {
        const parts = val.split('-');
        if (parts.length === 3) {
          this.endYear.set(parseInt(parts[0], 10));
          this.endMonth.set(parseInt(parts[1], 10) - 1);
        }
      }
    }
  }

  protected isSelectedDate(type: 'start' | 'end', date: Date): boolean {
    const val = this.form.get(type === 'start' ? 'validityStartDate' : 'validityEndDate')?.value;
    if (!val) return false;
    const parts = val.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      return date.getFullYear() === y && date.getMonth() === m && date.getDate() === d;
    }
    return false;
  }

  protected toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.isOpen.update((v) => !v);
  }

  protected selectCompany(id: number | null): void {
    this.form.get('insuranceCompanyId')?.setValue(id);
    this.form.get('insuranceCompanyId')?.markAsDirty();
    this.isOpen.set(false);
  }

  protected currentCompanyName(): string {
    const id = this.form.get('insuranceCompanyId')?.value;
    if (id == null) return 'Select';
    const comp = this.insuranceCompanies().find((c) => c.id === id);
    return comp ? comp.name : 'Select';
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
      this.isStartDateOpen.set(false);
      this.isEndDateOpen.set(false);
    }
  }

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
    compensation: [null as number | null, Validators.required],
    compensationType: ['percentage' as 'percentage' | 'amount', Validators.required],
    validityStartDate: [null as string | null],
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
      compensation: record.compensation,
      compensationType: record.compensationType,
      validityStartDate: toDateInputValue(record.validityStartDate),
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
      compensation: null,
      compensationType: 'percentage',
      validityStartDate: null,
      validityEndDate: '',
    });
  }

  private clearMessages(): void {
    this.successMessage.set('');
    this.errorMessage.set('');
    this.infoMessage.set('');
  }
}

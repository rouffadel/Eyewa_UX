import { AfterViewInit, Component, ElementRef, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { StoreService } from '../../auth/services/store.service';
import { posTabFromUrlSegment } from '../../../shared/models/pos-tab';
import { formatInvoiceDate } from './models/customer-sales.models';
import {
  getMobileValidationMessage,
  mobileNumberValidator,
  normalizeMobileDigits,
} from './models/customer.validators';
import { CustomerService } from './services/customer.service';
import { CustomerSessionService } from './services/customer-session.service';
import { SellSessionStore } from '../sell/services/sell-session.store';

@Component({
  selector: 'app-create-customer-form',
  imports: [ReactiveFormsModule],
  templateUrl: './create-customer-form.component.html',
  styleUrl: './create-customer-form.component.css',
})
export class CreateCustomerFormComponent implements OnInit, AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly storeService = inject(StoreService);
  private readonly customerService = inject(CustomerService);
  private readonly customerSession = inject(CustomerSessionService);
  private readonly sellStore = inject(SellSessionStore);

  private readonly selectedStoreId = signal<string | null>(null);

  protected readonly isSaving = signal(false);
  protected readonly successMessage = signal('');
  protected readonly errorMessage = signal('');

  protected readonly form = this.fb.group({
    customerName: ['', [Validators.required, Validators.minLength(2)]],
    customerNo: ['', [Validators.required, mobileNumberValidator()]],
  });

  ngOnInit(): void {
    void this.loadStoreContext();
  }

  ngAfterViewInit(): void {
    this.resetPageScroll();
  }

  private resetPageScroll(): void {
    const page = this.host.nativeElement.querySelector('.create-customer-page');
    if (page instanceof HTMLElement) {
      page.scrollTop = 0;
    }

    const shell = this.host.nativeElement.closest('.pos-shell__content');
    if (shell instanceof HTMLElement) {
      shell.scrollTop = 0;
    }
  }

  protected goBack(): void {
    const returnTo = this.route.snapshot.queryParamMap.get('returnTo') ?? undefined;
    const tab = posTabFromUrlSegment(returnTo) ?? 'sell';
    void this.router.navigate(['/home', tab]);
  }

  protected onCancel(): void {
    this.goBack();
  }

  protected onMobileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = normalizeMobileDigits(input.value);

    if (input.value !== digits) {
      input.value = digits;
    }

    this.form.controls.customerNo.setValue(digits);
    this.form.controls.customerNo.markAsDirty();
    this.form.controls.customerNo.updateValueAndValidity();
  }

  protected onMobileBlur(): void {
    this.form.controls.customerNo.markAsTouched();
  }

  protected mobileErrorMessage(): string | null {
    const control = this.form.controls.customerNo;
    if (!control.invalid || (!control.touched && !control.dirty)) {
      return null;
    }

    return getMobileValidationMessage(control);
  }

  protected nameErrorMessage(): string | null {
    const control = this.form.controls.customerName;
    if (!control.invalid || (!control.touched && !control.dirty)) {
      return null;
    }

    if (control.hasError('required')) {
      return 'Customer name is required.';
    }

    if (control.hasError('minlength')) {
      return 'Customer name must be at least 2 characters.';
    }

    return null;
  }

  protected onSave(): void {
    this.clearMessages();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set(this.getValidationMessage());
      return;
    }

    const loginId = this.authService.user()?.loginId;
    const storeId = this.resolveStoreId();

    if (loginId == null) {
      this.errorMessage.set('Unable to save customer. Please sign in again.');
      return;
    }

    if (!storeId) {
      this.errorMessage.set('Unable to save customer. No store selected.');
      return;
    }

    const raw = this.form.getRawValue();
    const payload = {
      storeId,
      customerName: raw.customerName?.trim() ?? '',
      customerNo: this.normalizeMobile(raw.customerNo ?? ''),
      loginId: String(loginId),
      invoiceNo: '',
      invoiceDate: formatInvoiceDate(),
    };

    this.isSaving.set(true);

    this.customerService
      .insertSales(payload)
      .then((result) => {
        this.customerSession.saveFromCreate(payload, result);
        this.sellStore.selectCreatedCustomer();

        this.successMessage.set(
          result.invoiceNo
            ? `Customer saved. Invoice ${result.invoiceNo}`
            : 'Customer saved successfully.',
        );
        this.form.markAsPristine();

        const returnTo = this.route.snapshot.queryParamMap.get('returnTo') ?? undefined;
        const tab = posTabFromUrlSegment(returnTo) ?? 'sell';
        void this.router.navigate(['/home', tab]);
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Unable to save customer.';
        this.errorMessage.set(message);
      })
      .finally(() => {
        this.isSaving.set(false);
      });
  }

  private async loadStoreContext(): Promise<void> {
    const loginId = this.authService.user()?.loginId;
    if (loginId == null) {
      this.errorMessage.set('Unable to load store. Please sign in again.');
      return;
    }

    const sessionStoreId =
      this.authService.selectedStore()?.storeId ?? this.authService.user()?.storeId;

    if (sessionStoreId != null && sessionStoreId > 0) {
      this.selectedStoreId.set(String(sessionStoreId));
      return;
    }

    try {
      const stores = await this.storeService.fillStores(loginId, 0);
      const preferred =
        stores.find((store) => store.isDefault) ?? stores[0];
      if (preferred) {
        this.selectedStoreId.set(String(preferred.storeId));
      }
    } catch {
      // Store is resolved from session when available; save will surface an error if missing.
    }
  }

  private resolveStoreId(): string | null {
    const sessionStoreId =
      this.authService.selectedStore()?.storeId ?? this.authService.user()?.storeId;

    if (sessionStoreId != null && sessionStoreId > 0) {
      return String(sessionStoreId);
    }

    return this.selectedStoreId();
  }

  private normalizeMobile(value: string): string {
    return normalizeMobileDigits(value);
  }

  private getValidationMessage(): string {
    const name = this.form.controls.customerName;
    const mobile = this.form.controls.customerNo;

    if (name.hasError('required') || mobile.hasError('required')) {
      return 'Please enter customer name and mobile number.';
    }

    if (name.hasError('minlength')) {
      return 'Customer name must be at least 2 characters.';
    }

    if (mobile.hasError('mobileInvalid')) {
      return getMobileValidationMessage(mobile) ?? 'Enter a valid mobile number.';
    }

    return 'Please check the highlighted fields.';
  }

  private clearMessages(): void {
    this.successMessage.set('');
    this.errorMessage.set('');
  }
}

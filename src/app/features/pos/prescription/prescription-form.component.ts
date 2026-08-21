import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DialogService } from '../../../services/dialog.service';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { PrescriptionGridComponent } from '../../../shared/ui/prescription-grid/prescription-grid.component';
import { AuthService } from '../../auth/services/auth.service';
import { AppConfigService } from '../../../services/app-config.service';
import { CategoryOption } from '../sell/models/category.models';
import { formatMoney } from '../sell/services/payment.service';
import { CategoryService } from '../sell/services/category.service';
import { SellSessionStore } from '../sell/services/sell-session.store';
import {
  calculateLensLineTotal,
  createDefaultPrescriptionFormValue,
  createEmptyFrameLine,
  createEmptyLensLine,
  createEmptyEyePrescription,
  EyePrescription,
  normalizeEyePrescription,
  FRAME_CATEGORIES,
  parseNumericInput,
  PrescriptionFormValue,
  PrescriptionFrameLine,
  PrescriptionLensLine,
  PrescriptionRecord,
  hasPrescriptionLensData,
} from './models/prescription.models';
import {
  PrescriptionFrameLineComponent,
  PrescriptionFramesTemplate,
} from './prescription-frame-line/prescription-frame-line.component';
import { PrescriptionLensLineComponent } from './prescription-lens-line/prescription-lens-line.component';
import { PrescriptionLocalStorageService } from './services/prescription-local-storage.service';
import { PrescriptionService } from './services/prescription.service';
import {
  EMPTY_PRESCRIPTION_DROPDOWNS,
  PrescriptionDropdowns,
} from './models/prescription-dropdown.models';
import { PrescriptionDropdownService } from './services/prescription-dropdown.service';
import { formatPrescriptionSavedAt } from '../sell/services/prescription-summary.mapper';

@Component({
  selector: 'app-prescription-form',
  imports: [
    ReactiveFormsModule,
    PrescriptionGridComponent,
    PrescriptionFrameLineComponent,
    PrescriptionLensLineComponent,
  ],
  templateUrl: './prescription-form.component.html',
  styleUrl: './prescription-form.component.css',
})
export class PrescriptionFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly prescriptionService = inject(PrescriptionService);
  private readonly prescriptionStorage = inject(PrescriptionLocalStorageService);
  private readonly prescriptionDropdownService = inject(PrescriptionDropdownService);
  private readonly categoryService = inject(CategoryService);
  private readonly authService = inject(AuthService);
  private readonly sellStore = inject(SellSessionStore);
  private readonly appConfig = inject(AppConfigService);
  private readonly router = inject(Router);
  private readonly dialogService = inject(DialogService);

  protected readonly isSaving = signal(false);
  protected readonly successMessage = signal('');
  protected readonly errorMessage = signal('');
  protected readonly infoMessage = signal('');
  public readonly frameCategories = signal<readonly string[]>([...FRAME_CATEGORIES]);
  public readonly frameCategoryOptions = signal<readonly CategoryOption[]>([]);
  public readonly eyeDropdowns = signal<PrescriptionDropdowns>(EMPTY_PRESCRIPTION_DROPDOWNS);

  protected readonly selectedCustomer = computed(() => this.sellStore.selectedCustomer());
  protected readonly storeId = computed(() => {
    const selectedStore = this.authService.selectedStore();
    if (selectedStore?.storeId) {
      return selectedStore.storeId;
    }

    const userStoreId = this.authService.user()?.storeId;
    return userStoreId != null && userStoreId > 0 ? userStoreId : null;
  });
  protected readonly framesTemplate = computed<PrescriptionFramesTemplate>(() =>
    this.appConfig.settings?.prescriptionFramesTemplate === 'productSearch'
      ? 'productSearch'
      : 'guided',
  );
  protected readonly formatMoney = formatMoney;
  protected readonly framesExpanded = signal(true);
  protected readonly lensesExpanded = signal(true);
  private readonly loadedRecord = signal<PrescriptionRecord | null>(null);

  protected readonly savedAtLabel = computed(() => {
    const record = this.loadedRecord();
    if (!record) {
      return null;
    }

    return formatPrescriptionSavedAt(record.updatedAt);
  });

  protected readonly form = this.fb.group({
    orderLensEnabled: [true],
    frames: this.fb.array<FormGroup>([]),
    lenses: this.fb.array<FormGroup>([]),
    rightEye: this.createEyeGroup(),
    leftEye: this.createEyeGroup(),
    pd: [null as number | null],
    nearPd: [null as number | null],
    vd: [null as number | null],
    notes: [''],
  });

  ngOnInit(): void {
    this.resetToDefaults(false);
    void this.loadFrameCategories();
    void this.loadPrescriptionDropdowns();
    this.loadSavedPrescriptionForCustomer();
    void this.sellStore.loadActiveOffers();
  }

  private async loadFrameCategories(): Promise<void> {
    try {
      const categories = await this.categoryService.getCategories();
      const names = categories.map((category) => category.categoryName);

      if (names.length === 0) {
        return;
      }

      this.frameCategoryOptions.set(categories);
      this.frameCategories.set(names);
      this.applyDefaultFrameCategoryToLines();
    } catch {
      // Keep FRAME_CATEGORIES fallback.
    }
  }

  private async loadPrescriptionDropdowns(): Promise<void> {
    try {
      const dropdowns = await this.prescriptionDropdownService.getDropdowns();
      this.eyeDropdowns.set(dropdowns);
    } catch {
      // Keep empty dropdown fallback.
    }
  }

  private defaultFrameCategory(): string {
    return this.frameCategories()[0] ?? FRAME_CATEGORIES[0];
  }

  private resolveFrameCategoryId(categoryName: string): number | null {
    return (
      this.frameCategoryOptions().find((category) => category.categoryName === categoryName)
        ?.categoryId ?? null
    );
  }

  private applyDefaultFrameCategoryToLines(): void {
    const defaultCategory = this.defaultFrameCategory();

    this.frameLines.controls.forEach((group) => {
      const current = String(group.get('category')?.value ?? '').trim();
      const isKnown = this.frameCategories().includes(current);

      if (!current || !isKnown) {
        group.get('category')?.setValue(defaultCategory);
      }
    });
  }

  protected get rightEyeGroup(): FormGroup {
    return this.form.controls.rightEye as FormGroup;
  }

  protected get leftEyeGroup(): FormGroup {
    return this.form.controls.leftEye as FormGroup;
  }

  protected get frameLines(): FormArray<FormGroup> {
    return this.form.controls.frames as FormArray<FormGroup>;
  }

  protected get lensLines(): FormArray<FormGroup> {
    return this.form.controls.lenses as FormArray<FormGroup>;
  }

  protected lensesSectionTotal(): number {
    return this.lensLines.controls.reduce((sum, group) => {
      const value = group.getRawValue() as PrescriptionLensLine;
      return sum + calculateLensLineTotal(value.price, value.quantity);
    }, 0);
  }

  protected addFrameLine(): void {
    this.frameLines.push(this.createFrameGroup(createEmptyFrameLine(this.defaultFrameCategory())));
    this.framesExpanded.set(true);
    this.form.markAsDirty();
  }

  protected removeFrameLine(index: number): void {
    if (this.frameLines.length <= 1) {
      return;
    }

    this.frameLines.removeAt(index);
    this.form.markAsDirty();
  }

  protected addLensLine(): void {
    this.lensLines.push(this.createLensGroup(createEmptyLensLine()));
    this.lensesExpanded.set(true);
    this.form.markAsDirty();
  }

  protected removeLensLine(index: number): void {
    if (this.lensLines.length <= 1) {
      return;
    }

    this.lensLines.removeAt(index);
    this.form.markAsDirty();
  }

  protected toggleFramesExpanded(): void {
    this.framesExpanded.update((expanded) => !expanded);
  }

  protected toggleLensesExpanded(): void {
    this.lensesExpanded.update((expanded) => !expanded);
  }

  protected async onNewPrescription(): Promise<void> {
    if (!(await this.confirmDiscardChanges())) {
      return;
    }

    this.resetToDefaults(true);
  }

  protected async onSave(): Promise<void> {
    this.clearMessages();

    const selectedCustomer = this.selectedCustomer();

    if (!selectedCustomer) {
      this.errorMessage.set('Select a customer from the header before saving.');
      return;
    }

    const validationMessage = this.validateBeforeSave();
    if (validationMessage) {
      this.errorMessage.set(validationMessage);
      return;
    }

    this.isSaving.set(true);

    try {
      const payload = this.toPayload();
      const isFramesOnly = payload.frames.length > 0 && !hasPrescriptionLensData(payload);
      
      const recordData = {
        ...payload,
        customerId: selectedCustomer.id,
        salesId: selectedCustomer.salesId,
      };

      let record: PrescriptionRecord;
      if (!isFramesOnly) {
        record = await this.prescriptionService.save(recordData);
      } else {
        record = this.prescriptionStorage.save(recordData);
      }

      this.prescriptionStorage.save(record);

      if (isFramesOnly) {
        this.sellStore.applyFramesOnlyToCart(record);
        this.successMessage.set('Frames added to cart');
      } else {
        this.sellStore.applySavedPrescription(record);
        this.successMessage.set('Prescription saved');
      }

      this.loadedRecord.set(record);
      this.form.markAsPristine();
      void this.router.navigate(['/home/sell']);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unable to save prescription. Please try again.';
      this.errorMessage.set(message);
    } finally {
      this.isSaving.set(false);
    }
  }

  protected onPrint(): void {
    this.clearMessages();

    const lastSaved = this.prescriptionStorage.getLastSaved();
    if (!lastSaved) {
      this.infoMessage.set('Print preview is not connected yet');
      return;
    }

    this.prescriptionService.print(lastSaved.id).catch(() => {
      this.infoMessage.set('Print preview is not connected yet');
    });
  }

  protected async onCancel(): Promise<void> {
    if (!(await this.confirmDiscardChanges())) {
      return;
    }

    this.resetToDefaults(true);
  }

  private createEyeGroup(): FormGroup {
    const defaults = createEmptyEyePrescription();

    return this.fb.group({
      sph: [defaults.sph],
      cyl: [defaults.cyl],
      axis: [defaults.axis],
      add: [defaults.add],
    });
  }

  private createFrameGroup(line: PrescriptionFrameLine): FormGroup {
    return this.fb.group({
      category: [line.category],
      categoryId: [line.categoryId ?? this.resolveFrameCategoryId(line.category)],
      brandId: [line.brandId],
      brandName: [line.brandName],
      productId: [line.productId],
      modelNo: [line.modelNo],
      sellingPrice: [line.sellingPrice],
      quantity: [line.quantity],
      maxDiscount: [line.maxDiscount],
      discountPercent: [line.discountPercent],
    });
  }

  private createLensGroup(line: PrescriptionLensLine): FormGroup {
    return this.fb.group({
      orderLenseId: [line.orderLenseId],
      category: [line.category],
      orderLens: [line.orderLens],
      price: [line.price],
      quantity: [line.quantity],
      originalQuantity: [line.originalQuantity],
    });
  }

  private toPayload(): PrescriptionFormValue {
    const raw = this.form.getRawValue();
    const lenses = this.lensLines.controls
      .map((group) => this.normalizeLens(group.getRawValue()))
      .filter((line) => this.hasLensLineData(line));
    const frames = this.frameLines.controls
      .map((group) => this.normalizeFrame(group.getRawValue()))
      .filter((line) => this.hasFrameLineData(line));

    return {
      orderLensEnabled: lenses.length > 0,
      frames,
      lenses,
      rightEye: this.normalizeEye(raw.rightEye),
      leftEye: this.normalizeEye(raw.leftEye),
      pd: parseNumericInput(raw.pd),
      nearPd: parseNumericInput(raw.nearPd),
      vd: parseNumericInput(raw.vd),
      notes: raw.notes?.trim() ?? '',
    };
  }

  private normalizeFrame(value: Partial<PrescriptionFrameLine>): PrescriptionFrameLine {
    const category = value.category?.trim() ?? '';

    return {
      category,
      categoryId: value.categoryId ?? this.resolveFrameCategoryId(category),
      brandId: value.brandId ?? null,
      brandName: value.brandName?.trim() ?? '',
      productId: value.productId ?? null,
      modelNo: value.modelNo?.trim() ?? '',
      sellingPrice: parseNumericInput(value.sellingPrice),
      quantity: Math.max(1, value.quantity ?? 1),
      maxDiscount: parseNumericInput(value.maxDiscount),
      discountPercent: parseNumericInput(value.discountPercent),
    };
  }

  private normalizeLens(value: Partial<PrescriptionLensLine>): PrescriptionLensLine {
    return {
      orderLenseId: value.orderLenseId ?? null,
      category: value.category?.trim() ?? '',
      orderLens: value.orderLens?.trim() ?? '',
      price: parseNumericInput(value.price),
      quantity: Math.max(1, value.quantity ?? 1),
      originalQuantity: value.originalQuantity,
    };
  }

  private normalizeEye(value: Partial<EyePrescription>): EyePrescription {
    return normalizeEyePrescription(value);
  }

  private validateBeforeSave(): string | null {
    const frameGroupsWithData = this.frameLines.controls.filter((group) =>
      this.hasFrameLineData(group.getRawValue() as PrescriptionFrameLine),
    );
    const hasFrameData = frameGroupsWithData.length > 0;

    const lensGroupsWithData = this.lensLines.controls.filter((group) =>
      this.hasLensLineData(group.getRawValue() as PrescriptionLensLine),
    );

    if (!hasFrameData && lensGroupsWithData.length === 0) {
      return 'Add at least one frame or lens before saving.';
    }

    for (const group of lensGroupsWithData) {
      const line = group.getRawValue() as PrescriptionLensLine;
      const lineNo = this.lensLines.controls.indexOf(group) + 1;

      if (!line.category?.trim()) {
        return `Select a lens category for lens line ${lineNo}.`;
      }

      if (!line.orderLens?.trim()) {
        return `Enter order lens details for lens line ${lineNo}.`;
      }

      if (line.price == null) {
        return `Enter price for lens line ${lineNo}.`;
      }
    }

    // Frames-only orders do not require lens or Rx fields.
    if (!hasFrameData) {
      const rightEye = this.rightEyeGroup.getRawValue() as EyePrescription;
      const leftEye = this.leftEyeGroup.getRawValue() as EyePrescription;

      const odError = this.validateEyeValues(rightEye, 'right eye (OD)');
      if (odError) {
        return odError;
      }

      const osError = this.validateEyeValues(leftEye, 'left eye (OS)');
      if (osError) {
        return osError;
      }

      if (this.form.controls.pd.value == null) {
        return 'Enter PD.';
      }

      if (this.form.controls.nearPd.value == null) {
        return 'Enter Near PD.';
      }
    }

    for (const group of frameGroupsWithData) {
      const line = group.getRawValue() as PrescriptionFrameLine;

      if (!line.brandName?.trim()) {
        return 'Enter a brand for each frame line with data.';
      }

      if (!line.modelNo?.trim()) {
        return 'Enter a model number for each frame line with data.';
      }

      const maxDiscount = parseNumericInput(line.maxDiscount);
      const discountPercent = parseNumericInput(line.discountPercent);

      if (maxDiscount != null && discountPercent != null && discountPercent > maxDiscount) {
        return `Discount cannot exceed ${maxDiscount}%.`;
      }
    }

    return null;
  }

  private setFrameLines(lines: PrescriptionFrameLine[]): void {
    this.frameLines.clear();
    lines.forEach((line) => this.frameLines.push(this.createFrameGroup(line)));
  }

  private setLensLines(lines: PrescriptionLensLine[]): void {
    this.lensLines.clear();
    lines.forEach((line) => this.lensLines.push(this.createLensGroup(line)));
  }

  private resetToDefaults(clearMessages: boolean): void {
    const defaults = createDefaultPrescriptionFormValue(this.defaultFrameCategory());

    this.form.reset({
      orderLensEnabled: defaults.orderLensEnabled,
      rightEye: defaults.rightEye,
      leftEye: defaults.leftEye,
      pd: defaults.pd,
      nearPd: defaults.nearPd,
      vd: defaults.vd,
      notes: defaults.notes,
    });

    this.setFrameLines(defaults.frames);
    this.setLensLines(defaults.lenses);
    this.framesExpanded.set(true);
    this.lensesExpanded.set(true);
    this.loadedRecord.set(null);

    if (clearMessages) {
      this.clearMessages();
    }
  }

  private loadSavedPrescriptionForCustomer(): void {
    const customer = this.selectedCustomer();
    if (!customer?.id) {
      this.loadedRecord.set(null);
      return;
    }

    const selectedId = this.sellStore.selectedPrescriptionId();
    const record =
      (selectedId
        ? this.sellStore.resolvePrescriptionRecord(customer.id, selectedId)
        : null) ?? this.prescriptionStorage.getLatest(customer.id);

    if (!record) {
      this.loadedRecord.set(null);
      return;
    }

    this.applyRecord(record);
    this.loadedRecord.set(record);
  }

  private applyRecord(record: PrescriptionRecord): void {
    this.form.reset({
      orderLensEnabled: record.orderLensEnabled,
      rightEye: normalizeEyePrescription(record.rightEye),
      leftEye: normalizeEyePrescription(record.leftEye),
      pd: record.pd,
      nearPd: record.nearPd,
      vd: record.vd,
      notes: record.notes,
    });

    this.setFrameLines(
      record.frames.length > 0
        ? record.frames
        : [createEmptyFrameLine(this.defaultFrameCategory())],
    );
    this.setLensLines(
      record.lenses.length > 0 ? record.lenses : [createEmptyLensLine()],
    );
    this.framesExpanded.set(true);
    this.lensesExpanded.set(true);
    this.form.markAsPristine();
  }

  private async confirmDiscardChanges(): Promise<boolean> {
    if (!this.form.dirty) {
      return true;
    }

    return this.dialogService.confirm({
      title: 'Discard Changes',
      message: 'Discard unsaved order changes?',
      confirmText: 'Discard',
      cancelText: 'Cancel',
      isDestructive: true
    });
  }

  private clearMessages(): void {
    this.successMessage.set('');
    this.errorMessage.set('');
    this.infoMessage.set('');
  }

  private hasFrameLineData(line: PrescriptionFrameLine): boolean {
    return (
      Boolean(line.brandName?.trim()) ||
      Boolean(line.modelNo?.trim()) ||
      line.sellingPrice != null ||
      line.discountPercent != null
    );
  }

  private hasLensLineData(line: PrescriptionLensLine): boolean {
    return Boolean(line.orderLens?.trim()) || line.price != null;
  }

  private validateEyeValues(eye: EyePrescription, label: string): string | null {
    if (eye.sph === null) {
      return `Select SPH for ${label}.`;
    }

    if (eye.cyl === null) {
      return `Select CYL for ${label}.`;
    }

    if (eye.axis === null) {
      return `Select AXIS for ${label}.`;
    }

    if (eye.add === null) {
      return `Select ADD for ${label}.`;
    }

    return null;
  }
}

import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { FaceMeasurementDiagramComponent } from '../../../shared/ui/face-measurement-diagram/face-measurement-diagram.component';
import { optionalDecimalValidator } from '../prescription/models/prescription.validators';
import { SellSessionStore } from '../sell/services/sell-session.store';
import {
  createEmptyMeasurementsFormValue,
  FACE_FORM_OPTIONS,
  FaceForm,
  MeasurementsFormValue,
  normalizeMeasurementsFormValue,
} from './models/measurements.models';
import { MeasurementService } from './services/measurement.service';

@Component({
  selector: 'app-measurements-form',
  imports: [ReactiveFormsModule, FaceMeasurementDiagramComponent],
  templateUrl: './measurements-form.component.html',
  styleUrl: './measurements-form.component.css',
})
export class MeasurementsFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly measurementService = inject(MeasurementService);
  private readonly sellStore = inject(SellSessionStore);

  protected readonly selectedCustomer = computed(() => this.sellStore.selectedCustomer());

  protected readonly faceFormOptions = FACE_FORM_OPTIONS;
  protected readonly isEditing = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly hasSavedRecord = signal(false);
  protected readonly successMessage = signal('');
  protected readonly errorMessage = signal('');

  private savedRecordId: string | null = null;

  protected readonly form = this.fb.group({
    pd: [null as number | null, optionalDecimalValidator(40, 80)],
    nearPd: [null as number | null, optionalDecimalValidator(40, 80)],
    frameWidth: [null as number | null, optionalDecimalValidator(100, 160)],
    bridgeWidth: [null as number | null, optionalDecimalValidator(10, 30)],
    templeLength: [null as number | null, optionalDecimalValidator(120, 160)],
    lensHeight: [null as number | null, optionalDecimalValidator(20, 60)],
    wrapAngle: [null as number | null, optionalDecimalValidator(0, 30)],
    faceForm: ['Oval' as FaceForm],
    frameHeight: [null as number | null, optionalDecimalValidator(15, 40)],
  });

  ngOnInit(): void {
    this.loadLatest();
  }

  protected get showEditLink(): boolean {
    return this.hasSavedRecord() && !this.isEditing();
  }

  protected onEdit(): void {
    this.isEditing.set(true);
    this.form.enable();
    this.clearMessages();
  }

  protected onSave(): void {
    this.clearMessages();

    const customer = this.selectedCustomer();
    if (!customer?.id) {
      this.errorMessage.set('Select a customer from the header before saving measurements.');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Please check the highlighted fields');
      return;
    }

    this.isSaving.set(true);

    this.measurementService
      .save({ ...this.toPayload(), customerId: customer.id }, this.savedRecordId)
      .then((record) => {
        this.savedRecordId = record.id;
        this.hasSavedRecord.set(true);
        this.isEditing.set(false);
        this.form.disable();
        this.successMessage.set('Measurements saved');
      })
      .catch(() => {
        this.errorMessage.set('Unable to save measurements. Please try again.');
      })
      .finally(() => {
        this.isSaving.set(false);
      });
  }

  protected diagramPd(): number | null {
    return this.form.controls.pd.value;
  }

  protected diagramFrameWidth(): number | null {
    return this.form.controls.frameWidth.value;
  }

  protected diagramLensHeight(): number | null {
    return this.form.controls.lensHeight.value;
  }

  private loadLatest(): void {
    const customerId = this.selectedCustomer()?.id;
    if (!customerId) {
      this.form.reset(createEmptyMeasurementsFormValue());
      this.isEditing.set(true);
      this.hasSavedRecord.set(false);
      return;
    }

    this.measurementService
      .getLatest(customerId)
      .then((record) => {
        if (!record) {
          this.form.reset(createEmptyMeasurementsFormValue());
          this.isEditing.set(true);
          this.hasSavedRecord.set(false);
          return;
        }

        this.savedRecordId = record.id;
        this.hasSavedRecord.set(true);
        this.form.patchValue(record);
        this.isEditing.set(false);
        this.form.disable();
      })
      .catch(() => {
        this.errorMessage.set('Unable to load measurements.');
      });
  }

  private toPayload(): MeasurementsFormValue {
    const raw = this.form.getRawValue();
    return normalizeMeasurementsFormValue({
      ...raw,
      faceForm: raw.faceForm ?? 'Oval',
    });
  }

  private clearMessages(): void {
    this.successMessage.set('');
    this.errorMessage.set('');
  }
}

import { Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  EMPTY_PRESCRIPTION_DROPDOWNS,
  PrescriptionDropdownOption,
  PrescriptionDropdowns,
} from '../../../features/pos/prescription/models/prescription-dropdown.models';
import { EYE_FIELD_LABELS, EyeFieldKey } from '../../../features/pos/prescription/models/prescription.models';

@Component({
  selector: 'app-prescription-grid',
  imports: [ReactiveFormsModule],
  templateUrl: './prescription-grid.component.html',
  styleUrl: './prescription-grid.component.css',
})
export class PrescriptionGridComponent {
  readonly group = input.required<FormGroup>();
  readonly title = input.required<string>();
  readonly dropdowns = input<PrescriptionDropdowns>(EMPTY_PRESCRIPTION_DROPDOWNS);

  protected readonly fields: EyeFieldKey[] = ['sph', 'cyl', 'axis', 'add'];

  protected labelFor(field: EyeFieldKey): string {
    return EYE_FIELD_LABELS[field];
  }

  protected optionsFor(field: EyeFieldKey): readonly PrescriptionDropdownOption[] {
    return this.dropdowns()[field];
  }
}

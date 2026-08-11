import { Component, ElementRef, HostListener, inject, input, signal } from '@angular/core';
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
  private readonly elementRef = inject(ElementRef);
  readonly group = input.required<FormGroup>();
  readonly title = input.required<string>();
  readonly dropdowns = input<PrescriptionDropdowns>(EMPTY_PRESCRIPTION_DROPDOWNS);

  protected readonly fields: EyeFieldKey[] = ['sph', 'cyl', 'axis', 'add'];
  protected readonly openField = signal<string | null>(null);

  protected toggleDropdown(field: string, event: Event): void {
    event.stopPropagation();
    this.openField.update((current) => (current === field ? null : field));
  }

  protected selectOption(field: string, value: any): void {
    this.group().get(field)?.setValue(value);
    this.group().get(field)?.markAsDirty();
    this.openField.set(null);
  }

  protected currentLabel(field: string): string {
    const val = this.group().get(field)?.value;
    if (val == null) return 'Select';
    const opt = this.optionsFor(field as EyeFieldKey).find((o) => o.value === val);
    return opt ? opt.label : String(val);
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.openField.set(null);
    }
  }

  protected labelFor(field: EyeFieldKey): string {
    return EYE_FIELD_LABELS[field];
  }

  protected optionsFor(field: EyeFieldKey): readonly PrescriptionDropdownOption[] {
    return this.dropdowns()[field];
  }
}

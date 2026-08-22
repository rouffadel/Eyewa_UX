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
    const isCurrentlyOpen = this.openField() === field;
    const nextField = isCurrentlyOpen ? null : field;
    this.openField.set(nextField);

    if (nextField) {
      this.scrollToSelectedOption();
    }
  }

  private scrollToSelectedOption(): void {
    setTimeout(() => {
      const container = this.elementRef.nativeElement.querySelector(
        '.custom-select__options'
      ) as HTMLElement | null;
      if (!container) return;

      const selectedEl = container.querySelector(
        '.custom-select__option--selected'
      ) as HTMLElement | null;

      if (selectedEl) {
        const offset = selectedEl.offsetTop;
        const targetScrollTop = offset - container.clientHeight / 2 + selectedEl.clientHeight / 2;
        container.scrollTop = Math.max(0, targetScrollTop);
      }
    }, 0);
  }

  protected selectOption(field: string, value: any): void {
    this.group().get(field)?.setValue(value);
    this.group().get(field)?.markAsDirty();
    this.openField.set(null);
  }

  protected isSelected(field: string, optionValue: number | null): boolean {
    const rawVal = this.group().get(field)?.value;
    if (optionValue === null) {
      return rawVal === null || rawVal === undefined || rawVal === '';
    }
    if (rawVal === null || rawVal === undefined || rawVal === '') {
      return false;
    }
    if (rawVal === optionValue) {
      return true;
    }
    const parsed = typeof rawVal === 'number' ? rawVal : parseFloat(String(rawVal));
    return !isNaN(parsed) && Math.abs(parsed - optionValue) < 0.0001;
  }

  protected currentLabel(field: string): string {
    const val = this.group().get(field)?.value;
    if (val == null) return 'Select';
    const opt = this.optionsFor(field as EyeFieldKey).find((o) => this.isSelected(field, o.value));
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

import { Component, ElementRef, HostListener, inject, input, output, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { formatMoney } from '../../sell/services/payment.service';
import {
  calculateLensLineTotal,
  LENS_CATEGORY_OPTIONS,
} from '../models/prescription.models';

@Component({
  selector: 'app-prescription-lens-line',
  imports: [ReactiveFormsModule],
  templateUrl: './prescription-lens-line.component.html',
  styleUrl: './prescription-lens-line.component.css',
})
export class PrescriptionLensLineComponent {
  private readonly elementRef = inject(ElementRef);
  readonly group = input.required<FormGroup>();
  readonly index = input(0);

  readonly remove = output<void>();

  protected readonly categories = LENS_CATEGORY_OPTIONS;
  protected readonly formatMoney = formatMoney;

  protected readonly isOpen = signal(false);

  protected toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.isOpen.update((v) => !v);
  }

  protected selectCategory(value: string): void {
    this.group().get('category')?.setValue(value);
    this.group().get('category')?.markAsDirty();
    this.isOpen.set(false);
  }

  protected currentCategory(): string {
    return this.group().get('category')?.value ?? '';
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  protected lineTotalFor(group: FormGroup): number {
    const value = group.getRawValue() as {
      price: number | null;
      quantity: number;
    };

    return calculateLensLineTotal(value.price, value.quantity);
  }
}

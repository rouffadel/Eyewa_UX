import { Component, input, output } from '@angular/core';
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
  readonly group = input.required<FormGroup>();
  readonly index = input(0);

  readonly remove = output<void>();

  protected readonly categories = LENS_CATEGORY_OPTIONS;
  protected readonly formatMoney = formatMoney;

  protected lineTotalFor(group: FormGroup): number {
    const value = group.getRawValue() as {
      price: number | null;
      quantity: number;
    };

    return calculateLensLineTotal(value.price, value.quantity);
  }
}

import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { parseNumericInput } from './prescription.models';

export function optionalAxisValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = parseNumericInput(control.value);

    if (value === null) {
      return null;
    }

    if (!Number.isInteger(value) || value < 0 || value > 180) {
      return { axisRange: true };
    }

    return null;
  };
}

export function optionalDecimalValidator(min: number, max: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = parseNumericInput(control.value);

    if (value === null) {
      return null;
    }

    if (value < min || value > max) {
      return { decimalRange: { min, max } };
    }

    return null;
  };
}

export function discountPercentCapValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = parseNumericInput(control.value);

    if (value === null) {
      return null;
    }

    const maxDiscount = resolveFrameMaxDiscount(control);
    const cap = maxDiscount ?? 100;

    if (value < 0 || value > cap) {
      return { discountCap: { max: cap } };
    }

    return null;
  };
}

function resolveFrameMaxDiscount(control: AbstractControl): number | null {
  return parseNumericInput(control.parent?.get('maxDiscount')?.value);
}

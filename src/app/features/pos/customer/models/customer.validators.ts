import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Saudi: 966XXXXXXXXX, 05XXXXXXXX, or 5XXXXXXXX */
const SAUDI_MOBILE_PATTERN = /^(966\d{7,9}|05\d{8}|5\d{8})$/;

/** India: 91XXXXXXXXXX, 0XXXXXXXXXX, or XXXXXXXXXX (mobile starts with 6–9) */
const INDIAN_MOBILE_PATTERN = /^(91[6-9]\d{9}|0[6-9]\d{9}|[6-9]\d{9})$/;

export function isValidMobileNumber(digits: string): boolean {
  return SAUDI_MOBILE_PATTERN.test(digits) || INDIAN_MOBILE_PATTERN.test(digits);
}

export function mobileNumberValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = String(control.value ?? '').trim();

    if (!raw) {
      return null;
    }

    const digits = normalizeMobileDigits(raw);

    if (!digits) {
      return { mobileInvalid: true };
    }

    if (!/^\d+$/.test(digits)) {
      return { mobileInvalid: true };
    }

    if (digits.length < 9 || digits.length > 15) {
      return { mobileInvalid: true };
    }

    if (!isValidMobileNumber(digits)) {
      return { mobileInvalid: true };
    }

    return null;
  };
}

export function normalizeMobileDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function getMobileValidationMessage(control: AbstractControl): string | null {
  const digits = normalizeMobileDigits(String(control.value ?? ''));

  if (control.hasError('required')) {
    return 'Mobile number is required.';
  }

  if (!control.hasError('mobileInvalid')) {
    return null;
  }

  if (!digits) {
    return 'Mobile number is required.';
  }

  if (digits.length < 9 || digits.length > 15) {
    return 'Mobile number must be 9–15 digits.';
  }

  return 'Enter a valid Saudi or Indian mobile (e.g. 966512345678, 0512345678, 9876543210, 919876543210).';
}

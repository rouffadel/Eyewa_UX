import {
  getMobileValidationMessage,
  isValidMobileNumber,
  mobileNumberValidator,
  normalizeMobileDigits,
} from './customer.validators';

describe('mobileNumberValidator', () => {
  const validate = (value: string) =>
    mobileNumberValidator()({ value } as never);

  it('should accept valid Saudi mobile numbers', () => {
    expect(validate('966512345678')).toBeNull();
    expect(validate('0512345678')).toBeNull();
    expect(validate('512345678')).toBeNull();
    expect(validate('9666123883')).toBeNull();
  });

  it('should accept valid Indian mobile numbers', () => {
    expect(validate('9876543210')).toBeNull();
    expect(validate('919876543210')).toBeNull();
    expect(validate('09876543210')).toBeNull();
    expect(validate('8765432109')).toBeNull();
  });

  it('should reject invalid mobile numbers', () => {
    expect(validate('12345')).toEqual({ mobileInvalid: true });
    expect(validate('1234567890123456')).toEqual({ mobileInvalid: true });
    expect(validate('812345678')).toEqual({ mobileInvalid: true });
    expect(validate('5123456789')).toEqual({ mobileInvalid: true });
    expect(validate('abc')).toEqual({ mobileInvalid: true });
  });

  it('should normalize digits', () => {
    expect(normalizeMobileDigits('+966 51 234 5678')).toBe('966512345678');
    expect(normalizeMobileDigits('+91 98765 43210')).toBe('919876543210');
  });

  it('should identify valid numbers via helper', () => {
    expect(isValidMobileNumber('966512345678')).toBeTrue();
    expect(isValidMobileNumber('9876543210')).toBeTrue();
    expect(isValidMobileNumber('12345')).toBeFalse();
  });

  it('should return helpful validation messages', () => {
    const control = {
      value: '123',
      hasError: (key: string) => key === 'mobileInvalid',
    };

    expect(getMobileValidationMessage(control as never)).toContain('9–15 digits');
  });
});

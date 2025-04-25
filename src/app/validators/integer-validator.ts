import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function numberValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    const parsed = parseFloat(value)

    if (Number.isNaN(parsed)) {
      return { 'notANumber': true }
    }

    if (parsed <= 0.0) {
      return { 'invalid': true }
    }

    return null;
  };
}


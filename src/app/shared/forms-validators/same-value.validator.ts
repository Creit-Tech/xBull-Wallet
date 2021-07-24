import { ValidatorFn } from '@angular/forms';

export const sameValueValidator = (value: string): ValidatorFn => (control: AbstractControl): { [key: string]: any } | null =>
  value !== control.value
    ? { sameValue: false }
    : null;

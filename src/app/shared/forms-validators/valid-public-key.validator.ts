import { AbstractControl } from '@angular/forms';
import { StrKey } from '@stellar/stellar-sdk';

export const validPublicKeyValidator = (control: AbstractControl): { [key: string]: any } | null => {
  if (!control.value) {
    return { validPublicKey: false };
  }

  try {
    if (
      StrKey.isValidMed25519PublicKey(control.value) ||
      StrKey.isValidEd25519PublicKey(control.value)
    ) {
      return null;
    } else {
      return { validPublicKey: false };
    }
  } catch (e) {
    return { validPublicKey: false };
  }
};

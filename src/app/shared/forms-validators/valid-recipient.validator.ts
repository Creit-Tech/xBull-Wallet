import { AbstractControl } from '@angular/forms';
import { StrKey } from 'stellar-sdk';

/**
 * This function validates if a control value is either a valid public key or a contract address
 * @param control
 */
export const validRecipientKeyValidator = (control: AbstractControl): { [key: string]: any } | null => {
  if (!control.value) {
    return { validPublicKey: false };
  }

  try {
    if (
      StrKey.isValidMed25519PublicKey(control.value) ||
      StrKey.isValidEd25519PublicKey(control.value) ||
      StrKey.isValidContract(control.value)
    ) {
      return null;
    } else {
      return { validPublicKey: false };
    }
  } catch (e) {
    return { validPublicKey: false };
  }
};

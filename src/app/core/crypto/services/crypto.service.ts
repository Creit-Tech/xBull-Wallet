import { Injectable } from '@angular/core';
import { AES, PBKDF2, enc } from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class CryptoService {

  constructor() { }

  encryptText(text: string, secret: string): string {
    return AES.encrypt(text, secret).toString();
  }

  decryptText(text: string, secret: string): string {
    const decrypted = AES.decrypt(text, secret).toString(enc.Utf8);
    if (!decrypted) {
      throw new Error('Failed to decrypt value');
    }

    return decrypted;
  }
}

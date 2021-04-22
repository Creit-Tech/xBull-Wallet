import { Injectable } from '@angular/core';
import { AES, PBKDF2 } from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class CryptoService {

  constructor() { }

  hashPassword(password: string): string {
    return PBKDF2(password, 'WHAT_A_NICE_SALT').toString();
  }

  encryptText(text: string, secret: string): string {
    return AES.encrypt(text, secret).toString();
  }

  decryptText(text: string, secret: string): string {
    return AES.decrypt(text, secret).toString();
  }
}

import { Injectable } from '@angular/core';
import { generateMnemonic } from 'bip39';

@Injectable({
  providedIn: 'root'
})
export class MnemonicPhraseService {

  constructor() { }

  generateMnemonicPhrase(): string {
    return generateMnemonic(256);
  }
}

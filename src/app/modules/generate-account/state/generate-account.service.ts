import { Injectable } from '@angular/core';
import { GenerateAccountStore } from './generate-account.store';

@Injectable({
  providedIn: 'root'
})
export class GenerateAccountService {

  constructor(
    private readonly store: GenerateAccountStore,
  ) { }

  resetStore(): void {
    this.store.reset();
  }

  selectGenerateNewWalletPath(): void {
    this.store.update(state => ({
      ...state,
      pathType: 'new_wallet',
      step: 1,
    }));
  }

  saveMnemonicPhrase(phrase: string): void {
    this.store.update(state => ({
      ...state,
      mnemonicPhrase: phrase,
    }));
  }

  savePassword(password: string): void {
    this.store.update(state => ({
      ...state,
      password,
    }));
  }
}

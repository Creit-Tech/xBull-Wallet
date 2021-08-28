import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';

export interface GenerateAccountState {
  pathType?: 'new_wallet' | 'restore_wallet' | 'import_secret_key';
  mnemonicPhrase?: string;
  password?: string;
}

export function createInitialState(): GenerateAccountState {
  return {};
}

@Injectable()
@StoreConfig({ name: 'generate-account', resettable: true })
export class GenerateAccountStore extends Store<GenerateAccountState> {

  constructor() {
    super(createInitialState());
  }

}

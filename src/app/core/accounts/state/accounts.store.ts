import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { IAccount } from './account.model';

export interface AccountsState extends EntityState<IAccount> {
  accountsLocked: boolean;
  globalPasswordHash?: string;
}

function generateInitialValue(): AccountsState {
  return {
    accountsLocked: false,
  };
}

@Injectable({ providedIn: 'root' })
@StoreConfig({
  name: 'accounts',
  idKey: 'publicKey',
  resettable: true
})
export class AccountsStore extends EntityStore<AccountsState> {

  constructor() {
    super(generateInitialValue());
  }

}

import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { AccountsStore, AccountsState } from './accounts.store';

@Injectable({ providedIn: 'root' })
export class AccountsQuery extends QueryEntity<AccountsState> {

  constructor(protected store: AccountsStore) {
    super(store);
  }

}

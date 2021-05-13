import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { WalletsOperationsStore, WalletsOperationsState } from './wallets-operations.store';

@Injectable({ providedIn: 'root' })
export class WalletsOperationsQuery extends QueryEntity<WalletsOperationsState> {
  sendingPayment$ = this.select(state => state.sendingPayment);

  constructor(protected store: WalletsOperationsStore) {
    super(store);
  }

}

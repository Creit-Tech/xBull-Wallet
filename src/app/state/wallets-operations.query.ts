import { Injectable } from '@angular/core';
import { Order, QueryEntity } from '@datorama/akita';
import { WalletsOperationsState, WalletsOperationsStore } from './wallets-operations.store';

@Injectable({ providedIn: 'root' })
export class WalletsOperationsQuery extends QueryEntity<WalletsOperationsState> {
  sendingPayment$ = this.select(state => state.sendingPayment);
  gettingAccountRecords$ = this.select(state => state.gettingAccountRecords);

  constructor(protected store: WalletsOperationsStore) {
    super(store);
  }

}

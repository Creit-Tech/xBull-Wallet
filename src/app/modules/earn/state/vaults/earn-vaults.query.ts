import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { EarnVaultsStore, EarnVaultsState } from './earn-vaults.store';

@Injectable()
export class EarnVaultsQuery extends QueryEntity<EarnVaultsState> {
  requestingVaults$ = this.select(state => state.UIState.requestingVaults);
  creatingVault$ = this.select(state => state.UIState.creatingVault);
  creatingDeposit$ = this.select(state => state.UIState.creatingDeposit);

  constructor(protected store: EarnVaultsStore) {
    super(store);
  }

}

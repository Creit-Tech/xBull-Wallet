import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { ClaimableBalancesStore, ClaimableBalancesState } from './claimable-balances.store';

@Injectable({ providedIn: 'root' })
export class ClaimableBalancesQuery extends QueryEntity<ClaimableBalancesState> {
  gettingClaimableBalances$ = this.select(state => state.UIState.gettingClaimableBalances);
  claimingBalance$ = this.select(state => state.UIState.claimingBalance);

  constructor(protected store: ClaimableBalancesStore) {
    super(store);
  }

}

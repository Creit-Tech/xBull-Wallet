import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { ServerApi } from 'stellar-sdk';

export interface ClaimableBalancesState extends EntityState<ServerApi.ClaimableBalanceRecord> {
  UIState: {
    gettingClaimableBalances: boolean;
    claimingBalance: boolean;
  };
}

function initialState(): ClaimableBalancesState {
  return {
    UIState: {
      gettingClaimableBalances: false,
      claimingBalance: false,
    }
  };
}

@Injectable({ providedIn: 'root' })
@StoreConfig({
  name: 'claimable-balances',
  idKey: '_id'
})
export class ClaimableBalancesStore extends EntityStore<ClaimableBalancesState> {

  constructor() {
    super(initialState());
  }

  updateUIState(newState: Partial<ClaimableBalancesState['UIState']>): void {
    this.update(state => ({
      ...state,
      UIState: {
        ...state.UIState,
        ...newState,
      },
    }));
  }

}

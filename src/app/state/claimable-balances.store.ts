import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { Horizon } from 'stellar-sdk';

export interface ClaimableBalancesState extends EntityState<Horizon.ServerApi.ClaimableBalanceRecord & { accountId: string; _id: string }> {
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

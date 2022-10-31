import { Injectable } from '@angular/core';
import { arrayAdd, arrayRemove, StoreConfig } from '@datorama/akita';
import { BaseStore } from '~root/state/base.store';
import { IWalletsAccount } from '~root/state';
import { ItemPredicate } from '@datorama/akita/lib/types';

export interface AirtimeAccountToken {
  walletAccountId: IWalletsAccount['_id'];
  token: string;
}

export interface AirtimeState {
  UIState: {
    gettingCountries: boolean;
    gettingCountryOperators: boolean;
    generatingOrder: boolean;
    confirmOrder: boolean;
    gettingOrders: boolean;
  };
  authTokens: AirtimeAccountToken[];
}

export function createInitialState(): AirtimeState {
  return {
    UIState: {
      gettingCountries: false,
      gettingCountryOperators: false,
      generatingOrder: false,
      confirmOrder: false,
      gettingOrders: false,
    },
    authTokens: [],
  };
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'airtime' })
export class AirtimeStore extends BaseStore<AirtimeState> {

  constructor() {
    super(createInitialState());
  }

  addToken(data: AirtimeAccountToken): void {
    this.update((state) => ({
      authTokens: arrayAdd(state.authTokens, data),
    }));
  }

  removeTokenByPredicate(predicate: ItemPredicate<AirtimeAccountToken>): void {
    this.update((state) => ({
      authTokens: arrayRemove(state.authTokens, predicate),
    }));
  }

}

import { Injectable } from '@angular/core';
import { arrayAdd, arrayRemove, StoreConfig } from '@datorama/akita';
import { BaseStore } from '~root/state/base.store';
import { IWalletsAccount } from '~root/state';

export interface GiftCardAccountToken {
  walletAccountId: IWalletsAccount['_id'];
  token: string;
}

export interface GiftCardsState {
  UIState: {
    searchingProducts: boolean;
    gettingProductDetails: boolean;
    generatingOrder: boolean;
    confirmOrder: boolean;
  };
  authTokens: GiftCardAccountToken[];
}

export function createInitialState(): GiftCardsState {
  return {
    UIState: {
      searchingProducts: false,
      gettingProductDetails: false,
      generatingOrder: false,
      confirmOrder: false,
    },
    authTokens: [],
  };
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'gift-cards' })
export class GiftCardsStore extends BaseStore<GiftCardsState> {

  constructor() {
    super(createInitialState());
  }

  addToken(data: GiftCardAccountToken): void {
    this.update((state) => ({
      authTokens: arrayAdd(state.authTokens, data),
    }));
  }

  removeTokenById(id: GiftCardAccountToken['walletAccountId']): void {
    this.update((state) => ({
      authTokens: arrayRemove(state.authTokens, id, 'walletAccountId'),
    }));
  }

}

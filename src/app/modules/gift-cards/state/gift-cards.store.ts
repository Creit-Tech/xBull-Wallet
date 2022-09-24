import { Injectable } from '@angular/core';
import { arrayAdd, arrayRemove, StoreConfig } from '@datorama/akita';
import { BaseStore } from '~root/state/base.store';
import { IWalletsAccount } from '~root/state';
import { ItemPredicate } from '@datorama/akita/lib/types';

export interface GiftCardAccountToken {
  walletAccountId: IWalletsAccount['_id'];
  token: string;
}

export interface GiftCardsState {
  UIState: {
    searchingProducts: boolean;
    gettingProductDetails: boolean;
    gettingOrders: boolean;
    generatingOrder: boolean;
    confirmOrder: boolean;
    gettingRedeemCode: boolean;
  };
  authTokens: GiftCardAccountToken[];
}

export function createInitialState(): GiftCardsState {
  return {
    UIState: {
      searchingProducts: false,
      gettingProductDetails: false,
      gettingOrders: false,
      generatingOrder: false,
      confirmOrder: false,
      gettingRedeemCode: false,
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

  removeTokenByPredicate(predicate: ItemPredicate<GiftCardAccountToken>): void {
    this.update((state) => ({
      authTokens: arrayRemove(state.authTokens, predicate),
    }));
  }

}

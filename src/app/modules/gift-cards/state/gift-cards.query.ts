import { Injectable } from '@angular/core';
import { arrayFind, Query } from '@datorama/akita';
import { GiftCardsStore, GiftCardsState, GiftCardAccountToken } from './gift-cards.store';
import { IWalletsAccount } from '~root/state';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GiftCardsQuery extends Query<GiftCardsState> {
  searchingProducts$ = this.select(state => state.UIState.searchingProducts);
  gettingProductDetails$ = this.select(state => state.UIState.gettingProductDetails);
  gettingOrders$ = this.select(state => state.UIState.gettingOrders);
  generatingOrder$ = this.select(state => state.UIState.generatingOrder);
  confirmOrder$ = this.select(state => state.UIState.confirmOrder);
  gettingRedeemCode$ = this.select(state => state.UIState.gettingRedeemCode);

  constructor(protected store: GiftCardsStore) {
    super(store);
  }

  getWalletAccountToken(walletAccountId: IWalletsAccount['_id']): Observable<GiftCardAccountToken | null> {
    return this.select(state => state.authTokens)
      .pipe(arrayFind<GiftCardAccountToken | null>(walletAccountId, 'walletAccountId'));
  }

}

import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { WalletsOffersStore, WalletsOffersState } from './wallets-offers.store';
import { ServerApi } from 'stellar-sdk';
import OfferRecord = ServerApi.OfferRecord;

@Injectable({ providedIn: 'root' })
export class WalletsOffersQuery extends QueryEntity<WalletsOffersState> {
  sendingPathPaymentStrictSend$ = this.select(state => state.UIState.sendingPathPaymentStrictSend);
  sendingPathPaymentStrictReceive$ = this.select(state => state.UIState.sendingPathPaymentStrictReceive);
  sendingOffer$ = this.select(state => state.UIState.sendingOffer);

  constructor(protected store: WalletsOffersStore) {
    super(store);
  }

  getOffersByPublicKey(publicKey: OfferRecord['seller']) {
    return this.selectAll({ filterBy: entity => entity.seller === publicKey });
  }

}

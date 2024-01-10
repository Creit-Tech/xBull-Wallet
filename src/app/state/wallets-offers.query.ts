import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { WalletsOffersStore, WalletsOffersState } from './wallets-offers.store';
import { Horizon } from 'stellar-sdk';
import OfferRecord = Horizon.ServerApi.OfferRecord;

@Injectable({ providedIn: 'root' })
export class WalletsOffersQuery extends QueryEntity<WalletsOffersState> {
  sendingPathPaymentStrictSend$ = this.select(state => state.UIState.sendingPathPaymentStrictSend);
  sendingPathPaymentStrictReceive$ = this.select(state => state.UIState.sendingPathPaymentStrictReceive);
  sendingPathPayment$ = this.select(state => state.UIState.sendingPathPayment);
  sendingOffer$ = this.select(state => state.UIState.sendingOffer);

  constructor(protected store: WalletsOffersStore) {
    super(store);
  }

  getOffersByPublicKey(publicKey: OfferRecord['seller']) {
    return this.selectAll({ filterBy: entity => entity.seller === publicKey });
  }

}

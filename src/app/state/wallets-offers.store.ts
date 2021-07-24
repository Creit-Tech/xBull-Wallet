import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { ServerApi } from 'stellar-sdk';
import OfferRecord = ServerApi.OfferRecord;

export interface WalletsOffersState extends EntityState<OfferRecord> {
  sendingPathPaymentStrictSend: boolean;
  sendingPathPaymentStrictReceive: boolean;
  sendingOffer: boolean;
}

export function createInitialState(): WalletsOffersState {
  return {
    sendingPathPaymentStrictSend: false,
    sendingPathPaymentStrictReceive: false,
    sendingOffer: false,
  };
}

@Injectable({ providedIn: 'root' })
@StoreConfig({
  name: 'wallets-offers',
  idKey: 'id'
})
export class WalletsOffersStore extends EntityStore<WalletsOffersState> {

  constructor() {
    super(createInitialState());
  }

}
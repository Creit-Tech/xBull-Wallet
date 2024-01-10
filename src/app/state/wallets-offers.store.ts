import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { Horizon } from 'stellar-sdk';
import OfferRecord = Horizon.ServerApi.OfferRecord;

export interface WalletsOffersState extends EntityState<OfferRecord> {
  UIState: {
    sendingPathPaymentStrictSend: boolean;
    sendingPathPaymentStrictReceive: boolean;
    sendingPathPayment: boolean;
    sendingOffer: boolean;
  };
}

export function createInitialState(): WalletsOffersState {
  return {
    UIState: {
      sendingPathPaymentStrictSend: false,
      sendingPathPaymentStrictReceive: false,
      sendingPathPayment: false,
      sendingOffer: false,
    }
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

  updateUIState(newState: Partial<WalletsOffersState['UIState']>): void {
    this.update(state => ({
      ...state,
      UIState: {
        ...state.UIState,
        ...newState,
      },
    }));
  }

}

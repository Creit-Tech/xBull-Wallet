import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';

export interface TradeState {
  sendingPathPaymentStrictSend: boolean;
  sendingPathPaymentStrictReceive: boolean;
}

export function createInitialState(): TradeState {
  return {
    sendingPathPaymentStrictSend: false,
    sendingPathPaymentStrictReceive: false,
  };
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'trade' })
export class TradeStore extends Store<TradeState> {

  constructor() {
    super(createInitialState());
  }

}

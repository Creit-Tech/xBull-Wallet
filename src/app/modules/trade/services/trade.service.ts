import { Injectable } from '@angular/core';
import { TradeState, TradeStore } from '~root/modules/trade/state';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import { Horizon } from 'stellar-sdk';

@Injectable({
  providedIn: 'root'
})
export class TradeService {

  constructor(
    private readonly tradeStore: TradeStore,
    private readonly stellarSdkService: StellarSdkService,
  ) { }

  private submitAndUpdateStore(xdr: string, storeField: keyof TradeState): Promise<Horizon.SubmitTransactionResponse> {
    this.tradeStore.update(state => ({ ...state, [storeField]: true }));
    return this.stellarSdkService.submitTransaction(xdr)
      .then(response => {
        this.tradeStore.update(state => ({ ...state, [storeField]: false }));
        return response;
      })
      .catch(error => {
        this.tradeStore.update(state => ({ ...state, [storeField]: false }));
        return Promise.reject(error);
      });
  }

  sendPathPaymentStrictSend(xdr: string): Promise<Horizon.SubmitTransactionResponse> {
    return this.submitAndUpdateStore(xdr, 'sendingPathPaymentStrictSend');
  }

  sendPathPaymentStrictReceive(xdr: string): Promise<Horizon.SubmitTransactionResponse> {
    return this.submitAndUpdateStore(xdr, 'sendingPathPaymentStrictReceive');
  }

  sendManageBuyOffer(xdr: string): Promise<Horizon.SubmitTransactionResponse> {
    return this.submitAndUpdateStore(xdr, 'sendingOffer');
  }

  sendManageSellOffer(xdr: string): Promise<Horizon.SubmitTransactionResponse> {
    return this.submitAndUpdateStore(xdr, 'sendingOffer');
  }
}

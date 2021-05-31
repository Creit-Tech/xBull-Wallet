import { Injectable } from '@angular/core';
import { TradeStore } from '~root/modules/trade/state';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import BigNumber from 'bignumber.js';
import { Asset, Horizon, TransactionBuilder } from 'stellar-sdk';
import { ToastrService } from '~root/shared/toastr/toastr.service';

@Injectable({
  providedIn: 'root'
})
export class TradeService {

  constructor(
    private readonly tradeStore: TradeStore,
    private readonly stellarSdkService: StellarSdkService,
  ) { }

  sendPathPaymentStrictSend(xdr: string): Promise<Horizon.SubmitTransactionResponse> {
    this.tradeStore.update(state => ({ ...state, sendingPathPaymentStrictSend: true }));
    return this.stellarSdkService.submitTransaction(xdr)
      .then(response => {
        this.tradeStore.update(state => ({ ...state, sendingPathPaymentStrictSend: false }));
        return response;
      })
      .catch(error => {
        this.tradeStore.update(state => ({ ...state, sendingPathPaymentStrictSend: false }));
        return Promise.reject(error);
      });
  }
}

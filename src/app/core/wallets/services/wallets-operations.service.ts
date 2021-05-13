import { Injectable } from '@angular/core';
import { StellarSdkService } from '~root/libs/stellar/stellar-sdk.service';
import { WalletsOperationsStore } from '~root/core/wallets/state';
import { Horizon } from 'stellar-sdk';

@Injectable({
  providedIn: 'root'
})
export class WalletsOperationsService {

  constructor(
    private readonly walletsOperationsStore: WalletsOperationsStore,
    private readonly stellarSdkService: StellarSdkService,
  ) { }

  sendPayment(xdr: string): Promise<Horizon.SubmitTransactionResponse> {
    this.walletsOperationsStore.update(state => ({ ...state, sendingPayment: true }));
    return this.stellarSdkService.submitTransaction(xdr)
      .then(response => {
        this.walletsOperationsStore.update(state => ({ ...state, sendingPayment: false }));
        return response;
      })
      .catch(error => {
        this.walletsOperationsStore.update(state => ({ ...state, sendingPayment: false }));
        return Promise.reject(error);
      });
  }


}

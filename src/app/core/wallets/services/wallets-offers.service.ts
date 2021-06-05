import { Injectable } from '@angular/core';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import { IWalletsAccount, WalletsOffersState, WalletsOffersStore } from '~root/state';
import { Horizon, ServerApi } from 'stellar-sdk';
import OfferRecord = ServerApi.OfferRecord;

@Injectable({
  providedIn: 'root'
})
export class WalletsOffersService {

  constructor(
    private readonly stellarSdkService: StellarSdkService,
    private readonly walletsOffersStore: WalletsOffersStore,
  ) { }

  async getAccountActiveOffers(accountId: IWalletsAccount['_id']) {
    const response = await this.stellarSdkService.Server.offers().forAccount(accountId).call();
    this.walletsOffersStore.add(response.records);

    return response;
  }

  removeOfferById(id: OfferRecord['id']): void {
    this.walletsOffersStore.remove(id);
  }

  private submitAndUpdateStore(xdr: string, storeField: keyof WalletsOffersState): Promise<Horizon.SubmitTransactionResponse> {
    this.walletsOffersStore.update(state => ({ ...state, [storeField]: true }));
    return this.stellarSdkService.submitTransaction(xdr)
      .then(response => {
        this.walletsOffersStore.update(state => ({ ...state, [storeField]: false }));
        return response;
      })
      .catch(error => {
        this.walletsOffersStore.update(state => ({ ...state, [storeField]: false }));
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

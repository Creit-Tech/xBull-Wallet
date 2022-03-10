import { Injectable } from '@angular/core';
import { ClaimableBalancesStore, IWalletsAccount } from '~root/state';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import { Horizon, ServerApi } from 'stellar-sdk';
import CollectionPage = ServerApi.CollectionPage;

@Injectable({
  providedIn: 'root'
})
export class ClaimableBalancesService {

  constructor(
    private readonly claimableBalancesStore: ClaimableBalancesStore,
    private readonly stellarSdkService: StellarSdkService,
  ) { }

  async getClaimableBalancesForClaimant(claimantPublicKey: IWalletsAccount['publicKey']): Promise<CollectionPage<ServerApi.ClaimableBalanceRecord>> {
    this.claimableBalancesStore.updateUIState({ gettingClaimableBalances: true });

    try {
      const response = await this.stellarSdkService.Server
        .claimableBalances()
        .claimant(claimantPublicKey)
        .call();

      this.claimableBalancesStore.updateUIState({ gettingClaimableBalances: false });

      return response;
    } catch (error: any) {
      console.error(error);
      this.claimableBalancesStore.updateUIState({ gettingClaimableBalances: false });
      throw error;
    }
  }

  async claimBalance(xdr: string): Promise<Horizon.SubmitTransactionResponse> {
    this.claimableBalancesStore.updateUIState({ claimingBalance: true });

    try {
      const response = await this.stellarSdkService.submitTransaction(xdr);
      this.claimableBalancesStore.updateUIState({ claimingBalance: false });
      return response;
    } catch (error: any) {
      console.error(error);
      this.claimableBalancesStore.updateUIState({ claimingBalance: false });
      throw error;
    }
  }
}

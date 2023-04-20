import { Injectable } from '@angular/core';
import { ClaimableBalancesStore, IWalletsAccount } from '~root/state';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import { Horizon, ServerApi } from 'stellar-sdk';
import CollectionPage = ServerApi.CollectionPage;
import { applyTransaction } from '@datorama/akita';
import { isAfter, isBefore } from 'date-fns';
import { type } from 'os';

@Injectable({
  providedIn: 'root'
})
export class ClaimableBalancesService {

  constructor(
    private readonly claimableBalancesStore: ClaimableBalancesStore,
    private readonly stellarSdkService: StellarSdkService,
  ) { }

  async getClaimableBalancesForClaimant(walletAccount: IWalletsAccount): Promise<CollectionPage<ServerApi.ClaimableBalanceRecord>> {
    this.claimableBalancesStore.updateUIState({ gettingClaimableBalances: true });

    try {
      const response = await this.stellarSdkService.selectServer()
        .claimableBalances()
        .limit(100)
        .claimant(walletAccount.publicKey)
        .call();

      applyTransaction(() => {
        this.claimableBalancesStore.updateUIState({ gettingClaimableBalances: false });
        // we can think later if we should keep airdrops for all of the account IE upsert instead of set
        this.claimableBalancesStore.upsertMany(response.records.map(r => ({ ...r, _id: r.id, accountId: walletAccount._id })));
      });

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

  removeClaimableBalance(claimableBalanceId: string): void {
    this.claimableBalancesStore.remove(claimableBalanceId);
  }
}

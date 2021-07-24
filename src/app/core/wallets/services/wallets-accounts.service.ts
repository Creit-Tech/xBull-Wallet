import { Injectable } from '@angular/core';
import { Server, NotFoundError, Horizon, ServerApi } from 'stellar-sdk';
import { from, of, throwError } from 'rxjs';
import {
  createWalletsAccount, IHorizonApi, IWallet, IWalletAsset,
  IWalletsAccount,
  WalletsAccountsQuery,
  WalletsAccountsStore,
  WalletsAssetsStore,
} from '~root/state';
import { catchError, map, withLatestFrom } from 'rxjs/operators';
import { applyTransaction } from '@datorama/akita';
import { WalletsAssetsService } from '~root/core/wallets/services/wallets-assets.service';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import { IWalletsAccountUI } from '~root/state/wallets-accounts.store';
import BalanceLine = Horizon.BalanceLine;
import BigNumber from 'bignumber.js';

@Injectable({
  providedIn: 'root'
})
export class WalletsAccountsService {
  constructor(
    private readonly walletsAccountsStore: WalletsAccountsStore,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly walletsAssetsStore: WalletsAssetsStore,
    private readonly walletsAssetsService: WalletsAssetsService,
    private readonly stellarSdkService: StellarSdkService,
  ) { }

  private saveAccountAndAssets(accountId: IWalletsAccount['_id'], accountRecord: ServerApi.AccountRecord | undefined): void {
    this.walletsAccountsStore.upsert(accountId, state => ({
      ...state,
      isCreated: !!accountRecord,
      accountRecord
    }));

    if (!!accountRecord) {
      for (const balanceLine of accountRecord.balances) {
        if (balanceLine.asset_type === 'native') {
          this.walletsAssetsStore.upsert(
            this.walletsAssetsService.formatBalanceLineId(balanceLine),
            this.walletsAssetsService.nativeAssetDefaultRecord()
          );
        } else {
          this.walletsAssetsStore.upsert(
            this.walletsAssetsService.formatBalanceLineId(balanceLine),
            {
              _id: this.walletsAssetsService.formatBalanceLineId(balanceLine),
              assetCode: balanceLine.asset_code,
              assetExtraDataLoaded: false,
              assetIssuer: balanceLine.asset_issuer,
            },
            (id, newEntity: any) => ({ ...newEntity, assetExtraDataLoaded: false }),
            {}
          );
        }
      }
    }
  }

  getAccountData({ account, horizonApi }: { account: IWalletsAccount, horizonApi: IHorizonApi }): Observable<IWalletsAccount> {
    this.walletsAccountsStore.ui.upsert(account._id, state => ({ ...state, requesting: true }));
    const accountPromise = new Server(horizonApi.url).accounts().accountId(account.publicKey).call();

    // TODO: change this IE remove the select entity logic and return the record instead
    const walletAccount = this.walletsAccountsQuery.selectEntity(account._id);

    return from(accountPromise)
      .pipe(catchError(error => {
        this.walletsAccountsStore.ui.upsert(account._id, state => ({ ...state, requesting: false }));
        return (error instanceof NotFoundError)
          ? of(undefined)
          : throwError(error);
      }))
      .pipe(withLatestFrom(walletAccount))
      .pipe(map(([accountRecord, entity]) => {
        this.walletsAccountsStore.ui.upsert(account._id, state => ({ ...state, requesting: false }));
        if (!entity) {
          throw new Error('This account does not exists in our wallet');
        }

        this.saveAccountAndAssets(account._id, accountRecord);

        return entity;
      }));
  }

  parseAccountBalances(balances: Horizon.BalanceLine[]): AccountParsedBalance[] {
    return balances.map(balance => ({
      assetCode: balance.asset_type === 'native' ? 'XLM' : balance.asset_code,
      balance: balance.balance,
      buyingLiabilities: balance.buying_liabilities,
      sellingLiabilities: balance.selling_liabilities,
      assetIssuer: balance.asset_type !== 'native' ? balance.asset_issuer : undefined,
    }));
  }

  createStream({ account, horizonApi }: { account: IWalletsAccount, horizonApi: IHorizonApi }): void {
    if (account && !account.streamCreated) {
      new Server(horizonApi.url).accounts()
        .accountId(account.publicKey)
        .stream({
          onmessage: accountRecord => {
            this.saveAccountAndAssets(account._id, accountRecord);
            this.walletsAccountsStore.upsert(account._id, state => ({ ...state, streamCreated: true }));
          }
        });
    }
  }

  removeAccounts(walletIds: Array<IWalletsAccount['_id']>): void {
    this.walletsAccountsStore.remove(walletIds);
  }
}

export interface AccountParsedBalance {
  balance: string;
  assetCode: 'XLM' | string;
  assetIssuer?: string;
  buyingLiabilities: string;
  sellingLiabilities: string;
}

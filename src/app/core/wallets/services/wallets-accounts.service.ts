import { Injectable } from '@angular/core';
import { Server, NotFoundError, Horizon, ServerApi } from 'stellar-sdk';
import { from, of, throwError } from 'rxjs';
import {
  BalanceAssetType,
  createWalletsAccount, createWalletsOperation, IHorizonApi, IWallet, IWalletAsset,
  IWalletsAccount,
  WalletsAccountsQuery,
  WalletsAccountsStore,
  WalletsAssetsStore, WalletsOperationsStore,
} from '~root/state';
import { catchError, map, withLatestFrom } from 'rxjs/operators';
import { applyTransaction } from '@datorama/akita';
import { WalletsAssetsService } from '~root/core/wallets/services/wallets-assets.service';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import { IWalletsAccountUI } from '~root/state/wallets-accounts.store';
import BalanceLine = Horizon.BalanceLine;
import BigNumber from 'bignumber.js';
import OperationRecord = ServerApi.OperationRecord;

@Injectable({
  providedIn: 'root'
})
export class WalletsAccountsService {
  private activeAccountsStreams: Array<{ account: IWalletsAccount['_id']; stream: () => void }> = [];
  private activeOperationsStreams: Array<{ account: IWalletsAccount['_id']; stream: () => void }> = [];

  constructor(
    private readonly walletsAccountsStore: WalletsAccountsStore,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly walletsAssetsStore: WalletsAssetsStore,
    private readonly walletsAssetsService: WalletsAssetsService,
    private readonly stellarSdkService: StellarSdkService,
    private readonly walletsOperationsStore: WalletsOperationsStore,
  ) { }

  private saveAccountAndAssets(accountId: IWalletsAccount['_id'], accountRecord: ServerApi.AccountRecord | undefined): void {
    this.walletsAccountsStore.upsert(accountId, state => ({
      ...state,
      isCreated: !!accountRecord,
      accountRecord
    }));

    if (!!accountRecord) {
      const filteredBalances: BalanceAssetType[] = this.walletsAssetsService.filterBalancesLines(accountRecord.balances);

      for (const balanceLine of filteredBalances) {
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

  createAccountStream({ account, horizonApi }: { account: IWalletsAccount, horizonApi: IHorizonApi }): void {
    const index = this.activeAccountsStreams.findIndex(record => record.account === account._id);
    if (account && !account.streamCreated && index === -1) {
      const newStream = new Server(horizonApi.url).accounts()
        .accountId(account.publicKey)
        .stream({
          onmessage: accountRecord => {
            this.saveAccountAndAssets(account._id, accountRecord);
            this.walletsAccountsStore.upsert(account._id, state => ({ ...state, streamCreated: true }));
          }
        });

      this.activeAccountsStreams.push({
        account: account._id,
        stream: newStream,
      });
    }
  }

  createOperationsStream(params: {
    account: IWalletsAccount,
    order: 'asc' | 'desc',
    cursor?: string,
    horizonApi: IHorizonApi
  }): void {
    const index = this.activeOperationsStreams.findIndex(record => record.account === params.account._id);
    if (params.account && !params.account.operationsStreamCreated && index === -1) {
      const streamBuilder = new Server(params.horizonApi.url).operations()
        .forAccount(params.account.publicKey)
        .limit(100)
        .includeFailed(false);

      streamBuilder.order(params.order);

      if (!!params.cursor) {
        streamBuilder.cursor(params.cursor);
      }

      const newStream = streamBuilder
        .stream({
          onmessage: (operationRecord) => {
            this.walletsOperationsStore.upsertMany([createWalletsOperation({
              ownerId: params.account._id,
              ownerPublicKey: params.account.publicKey,
              operation: operationRecord as any as OperationRecord,
            })]);
          }
        });

      this.activeOperationsStreams.push({
        account: params.account._id,
        stream: newStream,
      });
    }
  }

  removeAccounts(walletIds: Array<IWalletsAccount['_id']>): void {
    this.walletsAccountsStore.remove(walletIds);
    for (const walletId of walletIds) {
      const accountStreamIndex = this.activeAccountsStreams.findIndex(record => record.account === walletId);
      const accountOperationsIndex = this.activeOperationsStreams.findIndex(record => record.account === walletId);

      if (accountStreamIndex !== -1) {
        this.activeAccountsStreams[accountStreamIndex].stream();
        this.activeAccountsStreams.splice(accountStreamIndex, 1);
      }

      if (accountOperationsIndex !== -1) {
        this.activeOperationsStreams[accountOperationsIndex].stream();
        this.activeOperationsStreams.splice(accountOperationsIndex, 1);
      }
    }
  }
}

export interface AccountParsedBalance {
  balance: string;
  assetCode: 'XLM' | string;
  assetIssuer?: string;
  buyingLiabilities: string;
  sellingLiabilities: string;
}

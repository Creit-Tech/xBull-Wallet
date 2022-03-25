import { Injectable } from '@angular/core';
import { Server, NotFoundError, Horizon, ServerApi } from 'stellar-sdk';
import { from, Observable, of, throwError } from 'rxjs';
import {
  BalanceAssetType,
  createWalletsAccount, createWalletsOperation, IHorizonApi, IWallet, IWalletAsset,
  IWalletsAccount, IWalletsOperation, LpAssetsStore,
  WalletsAccountsQuery,
  WalletsAccountsStore,
  WalletsAssetsStore, WalletsOperationsStore,
} from '~root/state';
import { catchError, map, take, withLatestFrom } from 'rxjs/operators';
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
    private readonly lpAssetsStore: LpAssetsStore,
    private readonly stellarSdkService: StellarSdkService,
    private readonly walletsOperationsStore: WalletsOperationsStore,
  ) { }

  private saveAccountAndAssets(accountId: IWalletsAccount['_id'], accountRecord: ServerApi.AccountRecord | undefined): void {
    this.walletsAccountsStore.upsert(accountId, state => ({
      ...state,
      isCreated: !!accountRecord,
      // We do this to remove the functions from the account record stellar sdk object
      accountRecord: accountRecord && JSON.parse(JSON.stringify(accountRecord)),
    }));

    if (!!accountRecord) {
      const filteredBalances = accountRecord.balances;

      for (const balanceLine of filteredBalances) {
        switch (balanceLine.asset_type) {
          case 'liquidity_pool_shares':
            this.lpAssetsStore.upsert(balanceLine.liquidity_pool_id, state => ({
              _id: balanceLine.liquidity_pool_id,
              dataLoaded: 'dataLoaded' in state ? state.dataLoaded : false
            }));
            break;

          case 'credit_alphanum12':
          case 'credit_alphanum4':
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
            break;

          case 'native':
            this.walletsAssetsStore.upsert(
              this.walletsAssetsService.formatBalanceLineId(balanceLine),
              this.walletsAssetsService.nativeAssetDefaultRecord()
            );
            break;
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
    if (account) {
      const newStream = new Server(horizonApi.url).accounts()
        .accountId(account.publicKey)
        .stream({
          onmessage: accountRecord => {
            this.saveAccountAndAssets(account._id, accountRecord);
            this.walletsAccountsStore.upsert(account._id, state => ({ ...state, streamCreated: true }));
          }
        });

      this.activeAccountsStreams.forEach(stream => {
        stream.stream();
      });

      this.activeAccountsStreams = [{
        account: account._id,
        stream: newStream,
      }];
    }
  }

  createOperationsStream(params: {
    account: IWalletsAccount,
    order: 'asc' | 'desc',
    cursor?: string,
    horizonApi: IHorizonApi
  }): void {
    if (params.account) {
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

      this.activeOperationsStreams.forEach(stream => {
        stream.stream();
      });

      this.activeOperationsStreams = [{
        account: params.account._id,
        stream: newStream,
      }];
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

  getLatestAccountOperations(params: {
    account: IWalletsAccount,
    horizonApi: IHorizonApi,
    onlyPayments?: boolean,
  }): Promise<IWalletsOperation[]> {
    this.walletsOperationsStore.updateUIState({ gettingAccountsOperations: true });
    const server = new this.stellarSdkService.SDK.Server(params.horizonApi.url);
    return (!!params.onlyPayments ? server.payments() : server.operations())
      .forAccount(params.account.publicKey)
      .limit(100)
      .order('desc')
      .call()
      .then(response => {
        console.log({ response });
        const operations = response.records.map(operationRecord => {
          return createWalletsOperation({
            ownerId: params.account._id,
            ownerPublicKey: params.account.publicKey,
            operation: operationRecord as any as OperationRecord,
          });
        });

        applyTransaction(() => {
          this.walletsOperationsStore.updateUIState({ gettingAccountsOperations: false });
          this.walletsOperationsStore.set(operations);
        });

        return operations;
      });
  }

  async setAccountName(data: { publicKey: IWalletsAccount['publicKey']; name: IWalletsAccount['name'] }): Promise<void> {
    const sameNameAccount = await this.walletsAccountsQuery.selectAll({
      filterBy: entity => entity.name === data.name,
    }).pipe(take(1))
      .toPromise();

    if (sameNameAccount.length > 0) {
      throw new Error('Name is being used by another account.');
    }

    const accounts = await this.walletsAccountsQuery.selectAll({
      filterBy: entity => entity.publicKey === data.publicKey,
    }).pipe(take(1))
      .toPromise();

    this.walletsAccountsStore.upsert(accounts.map(a => a._id), {
      name: data.name,
    });
  }
}

export interface AccountParsedBalance {
  balance: string;
  assetCode: 'XLM' | string;
  assetIssuer?: string;
  buyingLiabilities: string;
  sellingLiabilities: string;
}

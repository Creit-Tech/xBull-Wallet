import { Injectable } from '@angular/core';
import { Server, NotFoundError, Horizon } from 'stellar-sdk';
import { from, of, throwError } from 'rxjs';
import {
  createWalletsAccount, IWalletAsset,
  IWalletsAccount,
  WalletsAccountsQuery,
  WalletsAccountsStore,
  WalletsAssetsStore,
} from '~root/core/wallets/state';
import { catchError, map, withLatestFrom } from 'rxjs/operators';
import { applyTransaction } from '@datorama/akita';
import { WalletsAssetsService } from '~root/core/wallets/services/wallets-assets.service';

@Injectable({
  providedIn: 'root'
})
export class WalletsAccountsService {
  // TODO: Make this optional before launching the app IE add a settings store
  get Server(): Server {
    return new Server('https://horizon-testnet.stellar.org');
  }

  constructor(
    private readonly walletsAccountsStore: WalletsAccountsStore,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly walletsAssetsStore: WalletsAssetsStore,
    private readonly walletsAssetsService: WalletsAssetsService,
  ) { }

  getAccountData(accountId: string): Observable<IWalletsAccount> {
    this.walletsAccountsStore.ui.upsert(accountId, state => ({ ...state, requesting: true }));
    const accountPromise = this.Server.accounts().accountId(accountId).call();

    // TODO: change this IE remove the select entity logic and return the record instead
    const walletAccount = this.walletsAccountsQuery.selectEntity(accountId);

    return from(accountPromise)
      .pipe(catchError(error => {
        return (error instanceof NotFoundError)
          ? of(undefined)
          : throwError(error);
      }))
      .pipe(withLatestFrom(walletAccount))
      .pipe(map(([accountRecord, entity]) => {
        this.walletsAccountsStore.ui.upsert(accountId, state => ({ ...state, requesting: false }));
        if (!entity) {
          throw new Error('This account does not exists in our wallet');
        }

        applyTransaction(() => {
          this.walletsAccountsStore.upsert(accountId, createWalletsAccount({
            ...entity,
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
                const newState = {
                  _id: this.walletsAssetsService.formatBalanceLineId(balanceLine),
                  assetCode: balanceLine.asset_code,
                  assetExtraDataLoaded: false,
                };

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
        });

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
}

export interface AccountParsedBalance {
  balance: string;
  assetCode: 'XLM' | string;
  assetIssuer?: string;
  buyingLiabilities: string;
  sellingLiabilities: string;
}

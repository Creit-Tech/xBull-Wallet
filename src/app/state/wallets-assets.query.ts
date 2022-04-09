import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { WalletsAssetsStore, WalletsAssetsState } from './wallets-assets.store';
import {
  IWalletAssetModel,
} from '~root/state/wallets-asset.model';
import { Observable, of } from 'rxjs';
import { SettingsQuery } from '~root/state/settings.query';
import { distinctUntilKeyChanged, switchMap } from 'rxjs/operators';
import { WalletsAccountsQuery } from '~root/state/wallets-accounts.query';
import { WalletsAssetsService } from '~root/core/wallets/services/wallets-assets.service';

@Injectable({ providedIn: 'root' })
export class WalletsAssetsQuery extends QueryEntity<WalletsAssetsState> {
  allAssets$ = this.selectAll();
  addingAsset$ = this.select(state => state.UIState.addingAsset);
  removingAsset$ = this.select(state => state.UIState.removingAsset);

  counterAsset$ = this.settingsQuery.counterAssetId$
    .pipe(switchMap(counterAssetId => this.selectEntity(counterAssetId)));

  selectedAccountAssets$ = this.walletsAccountsQuery.getSelectedAccount$
    .pipe(distinctUntilKeyChanged('_id'))
    .pipe(switchMap(selectedAccount => {
      const assetsBalances = selectedAccount.accountRecord?.balances || [];

      return this.selectAll({
        filterBy: entity => !!this.walletsAssetsService.filterBalancesLines(assetsBalances)
          .find(b => this.walletsAssetsService.formatBalanceLineId(b) === entity._id)
      });
    }));

  constructor(
    protected store: WalletsAssetsStore,
    private readonly settingsQuery: SettingsQuery,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly walletsAssetsService: WalletsAssetsService,
  ) {
    super(store);
  }

  getAssetsById(ids: Array<IWalletAssetModel['_id']>): Observable<IWalletAssetModel[]> {
    return this.selectMany(ids);
  }

}

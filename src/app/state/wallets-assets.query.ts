import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { WalletsAssetsStore, WalletsAssetsState } from './wallets-assets.store';
import {
  IWalletAssetIssued,
  IWalletAssetModel,
  IWalletAssetNative,
} from '~root/state/wallets-asset.model';
import { Observable } from 'rxjs';
import { SettingsQuery } from '~root/state/settings.query';
import { switchMap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class WalletsAssetsQuery extends QueryEntity<WalletsAssetsState> {
  allAssets$ = this.selectAll();
  addingAsset$ = this.select(state => state.UIState.addingAsset);
  removingAsset$ = this.select(state => state.UIState.removingAsset);

  counterAsset$ = this.settingsQuery.counterAssetId$
    .pipe(switchMap(counterAssetId => this.selectEntity(counterAssetId)));

  constructor(
    protected store: WalletsAssetsStore,
    private readonly settingsQuery: SettingsQuery,
  ) {
    super(store);
  }

  getAssetsById(ids: Array<IWalletAssetModel['_id']>): Observable<IWalletAssetModel[]> {
    return this.selectMany(ids);
  }

}

import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { WalletsAssetsStore, WalletsAssetsState } from './wallets-assets.store';
import { IWalletAsset } from '~root/state/wallets-asset.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WalletsAssetsQuery extends QueryEntity<WalletsAssetsState> {
  allAssets$ = this.selectAll();
  addingAsset$ = this.select(state => state.UIState.addingAsset);
  removingAsset$ = this.select(state => state.UIState.removingAsset);

  constructor(protected store: WalletsAssetsStore) {
    super(store);
  }

  getAssetsById(ids: Array<IWalletAsset['_id']>): Observable<IWalletAsset[]> {
    return this.selectMany(ids);
  }

}

import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { WalletsAssetsStore, WalletsAssetsState } from './wallets-assets.store';
import { IWalletAsset } from '~root/core/wallets/state/wallets-asset.model';

@Injectable({ providedIn: 'root' })
export class WalletsAssetsQuery extends QueryEntity<WalletsAssetsState> {

  constructor(protected store: WalletsAssetsStore) {
    super(store);
  }

  getAssetsById(ids: Array<IWalletAsset['_id']>): Observable<IWalletAsset[]> {
    return this.selectMany(ids);
  }

}

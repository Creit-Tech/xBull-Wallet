import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { IWalletAsset } from './wallets-asset.model';

export interface WalletsAssetsState extends EntityState<IWalletAsset> {
  addingAsset: boolean;
}

function createInitialState(): WalletsAssetsState {
  return {
    addingAsset: false,
  };
}

@Injectable({ providedIn: 'root' })
@StoreConfig({
  name: 'wallets-assets',
  idKey: '_id'
})
export class WalletsAssetsStore extends EntityStore<WalletsAssetsState> {

  constructor() {
    super(createInitialState());
  }

}

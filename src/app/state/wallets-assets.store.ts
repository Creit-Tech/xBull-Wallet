import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { IWalletAsset } from './wallets-asset.model';

export interface WalletsAssetsState extends EntityState<IWalletAsset> {
  UIState: {
    addingAsset: boolean;
    removingAsset: boolean;
  };
}

function createInitialState(): WalletsAssetsState {
  return {
    UIState: {
      addingAsset: false,
      removingAsset: false,
    },
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

  updateUIState(newState: Partial<WalletsAssetsState['UIState']>): void {
    this.update(state => ({
      ...state,
      UIState: {
        ...state.UIState,
        ...newState,
      },
    }));
  }

}

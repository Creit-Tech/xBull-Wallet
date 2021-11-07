import { Injectable } from '@angular/core';
import { EntityState, StoreConfig } from '@datorama/akita';
import { ILpAsset } from './lp-asset.model';
import { BaseEntityStore } from '~root/state/base-entity.store';

export interface LpAssetsState extends EntityState<ILpAsset> {
  UIState: {
    fetchingLatestPools: boolean;
    depositingLiquidity: boolean;
  };
}

function initialState(): LpAssetsState {
  return  {
    UIState: {
      fetchingLatestPools: false,
      depositingLiquidity: false,
    },
  };
}

@Injectable({ providedIn: 'root' })
@StoreConfig({
  name: 'lp-assets',
  idKey: '_id'
})
export class LpAssetsStore extends BaseEntityStore<LpAssetsState> {

  constructor() {
    super(initialState());
  }

}

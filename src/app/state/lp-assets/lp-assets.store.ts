import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { ILpAsset } from './lp-asset.model';

export interface LpAssetsState extends EntityState<ILpAsset> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({
  name: 'lp-assets',
  idKey: '_id'
})
export class LpAssetsStore extends EntityStore<LpAssetsState> {

  constructor() {
    super();
  }

}

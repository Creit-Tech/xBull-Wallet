import { Injectable } from '@angular/core';
import { EntityState, StoreConfig } from '@datorama/akita';
import { ICuratedAsset } from './curated-asset.model';
import { BaseEntityStore } from '~root/state/base-entity.store';

export interface CuratedAssetsState extends EntityState<ICuratedAsset> {
  UIState: {
    gettingCuratedListByCreitTech: boolean;
  };
}

@Injectable({ providedIn: 'root' })
@StoreConfig({
  name: 'curated-assets',
  idKey: '_id'
})
export class CuratedAssetsStore extends BaseEntityStore<CuratedAssetsState> {

  constructor() {
    super({
      UIState: {
        gettingCuratedListByCreitTech: false,
      }
    });
  }

}

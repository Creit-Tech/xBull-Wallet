import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { LpAssetsStore, LpAssetsState } from './lp-assets.store';

@Injectable({ providedIn: 'root' })
export class LpAssetsQuery extends QueryEntity<LpAssetsState> {

  constructor(protected store: LpAssetsStore) {
    super(store);
  }

}

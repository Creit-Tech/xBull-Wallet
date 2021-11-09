import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { LpAssetsStore, LpAssetsState } from './lp-assets.store';

@Injectable({ providedIn: 'root' })
export class LpAssetsQuery extends QueryEntity<LpAssetsState> {
  fetchingLatestPools$ = this.select(state => state.UIState.fetchingLatestPools);
  depositingLiquidity$ = this.select(state => state.UIState.depositingLiquidity);
  withdrawingLiquidity$ = this.select(state => state.UIState.withdrawingLiquidity);

  constructor(protected store: LpAssetsStore) {
    super(store);
  }

}

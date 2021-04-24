import { Injectable } from '@angular/core';
import { EntityUIQuery, QueryEntity } from '@datorama/akita';
import { WalletsStore, WalletsState, WalletsUIState } from './wallets.store';

@Injectable({ providedIn: 'root' })
export class WalletsQuery extends QueryEntity<WalletsState> {
  ui!: EntityUIQuery<WalletsUIState>;

  globalPasswordHash$ = this.select(state => state.globalPasswordHash);
  walletsLocked$ = this.select(state => state.walletsLocked);

  constructor(protected store: WalletsStore) {
    super(store);
    this.createUIQuery();
  }

}

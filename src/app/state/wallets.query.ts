import { Injectable } from '@angular/core';
import { EntityUIQuery, QueryEntity } from '@datorama/akita';
import { WalletsStore, WalletsState, WalletsUIState } from './wallets.store';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { IWallet } from '~root/state/wallet.model';

@Injectable({ providedIn: 'root' })
export class WalletsQuery extends QueryEntity<WalletsState> {
  ui!: EntityUIQuery<WalletsUIState>;

  passwordSet$ = this.select(state => state.passwordSet);
  walletsLocked$ = this.select(state => state.walletsLocked);

  isThereWallet$ = this.select(state => state.ids?.length && state.ids.length > 0);

  // This should only be used where we know there is at least one wallet saved in the store
  get getSelectedWallet$(): Observable<IWallet> {
    return this.selectActiveId()
      .pipe(switchMap(id => {
        if (!id) {
          return this.selectFirst() as Observable<IWallet>;
        }

        return this.selectEntity(id) as Observable<IWallet>;
      }));
  }

  constructor(protected store: WalletsStore) {
    super(store);
    this.createUIQuery();
  }

}

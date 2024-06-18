import { Injectable } from '@angular/core';
import { EntityUIQuery, QueryEntity } from '@datorama/akita';
import { WalletsAccountsStore, WalletsAccountsState, WalletsAccountsUIState, IWalletsAccountUI } from './wallets-accounts.store';
import { IWalletsAccount } from '~root/state/wallets-account.model';
import { map, pluck, switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WalletsAccountsQuery extends QueryEntity<WalletsAccountsState> {
  ui!: EntityUIQuery<WalletsAccountsUIState>;
  // This should only be used where we know there is at least one account saved in the store
  get getSelectedAccount$(): Observable<IWalletsAccount> {
    return this.selectActiveId()
      .pipe(switchMap(id => {
        if (!id) {
          return this.selectFirst() as Observable<IWalletsAccount>;
        }

        return this.selectEntity(id) as Observable<IWalletsAccount>;
      }));
  }

  constructor(protected store: WalletsAccountsStore) {
    super(store);
    this.createUIQuery();
  }

  getRequestingStatus(entityId: IWalletsAccount['_id']): Observable<IWalletsAccountUI['requesting']> {
    return this.ui.selectEntity(entityId)
      .pipe(map((entity: IWalletsAccountUI | undefined) => !!entity?.requesting));
  }

}

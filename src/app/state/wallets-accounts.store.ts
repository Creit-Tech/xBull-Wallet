import { Injectable } from '@angular/core';
import { ActiveState, EntityState, EntityStore, EntityUIStore, StoreConfig } from '@datorama/akita';
import { IWalletsAccount } from './wallets-account.model';

export interface WalletsAccountsState extends EntityState<IWalletsAccount>, ActiveState {}

export interface IWalletsAccountUI {
  _id: string;
  requesting: boolean;
}

export interface WalletsAccountsUIState extends EntityState<IWalletsAccountUI> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({
  name: 'wallets-accounts',
  idKey: '_id'
})
export class WalletsAccountsStore extends EntityStore<WalletsAccountsState> {
  ui!: EntityUIStore<WalletsAccountsUIState>;

  constructor() {
    super();
    this.createUIStore()
      .setInitialEntityState((entity: IWalletsAccount): IWalletsAccountUI => ({
        _id: entity._id,
        requesting: false,
      }));
  }

}

import { Injectable } from '@angular/core';
import { ActiveState, EntityState, EntityStore, EntityUIStore, StoreConfig } from '@datorama/akita';
import { IWallet } from './wallet.model';

export interface WalletsState extends EntityState<IWallet>, ActiveState  {
  storeVersion: number;

  walletsLocked: boolean;

  /**
   * This value is used to know if we already set a password at some point.
   * For example when we have added at least one private key to the wallet.
   * This value deprecated the `globalPasswordHash` value.
   */
  passwordSet: boolean;
}

export interface IWalletUI {
  _id: IWallet['_id'];
}

export interface WalletsUIState extends EntityState<IWalletUI> {}

function createInitialValue(): WalletsState {
  return {
    storeVersion: 3,
    active: 0,
    walletsLocked: false,
    passwordSet: false,
  };
}

@Injectable({ providedIn: 'root' })
@StoreConfig({
  name: 'wallets',
  idKey: '_id'
})
export class WalletsStore extends EntityStore<WalletsState> {
  ui!: EntityUIStore<WalletsUIState>;

  constructor() {
    super(createInitialValue());
    this.createUIStore()
      .setInitialEntityState((entity: IWallet): IWalletUI => ({
        _id: entity._id,
      }));
  }

}

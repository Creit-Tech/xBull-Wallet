import { Injectable } from '@angular/core';
import { ActiveState, EntityState, EntityStore, EntityUIStore, StoreConfig } from '@datorama/akita';
import { IWallet } from './wallet.model';

export interface WalletsState extends EntityState<IWallet>, ActiveState  {
  walletsLocked: boolean;
  globalPasswordHash?: string;
}

export interface IWalletUI {
  _id: IWallet['_id'];
}

export interface WalletsUIState extends EntityState<IWalletUI> {}

function createInitialValue(): WalletsState {
  return {
    active: 0,
    walletsLocked: false,
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

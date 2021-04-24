import { Injectable } from '@angular/core';
import { EntityState, EntityStore, EntityUIStore, StoreConfig } from '@datorama/akita';
import { IWallet } from './wallet.model';

export interface WalletsState extends EntityState<IWallet> {
  walletsLocked: boolean;
  globalPasswordHash?: string;
}

export interface IWalletUI {
  _id: IWallet['_id'];
  isSelected: boolean;
}

export interface WalletsUIState extends EntityState<IWalletUI> {}

function createInitialValue(): WalletsState {
  return {
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
        isSelected: false,
      }));
  }

}

import { Injectable } from '@angular/core';
import { EntityState, StoreConfig } from '@datorama/akita';
import { IEarnVault } from './earn-vault.model';
import { BaseEntityStore } from '~root/state/base-entity.store';

export interface EarnVaultsState extends EntityState<IEarnVault> {
  UIState: {
    requestingVaults: boolean;
    creatingVault: boolean;
    creatingDeposit: boolean;
  };
}

@Injectable()
@StoreConfig({
  name: 'earn-vaults',
  idKey: '_id',
  resettable: true,
})
export class EarnVaultsStore extends BaseEntityStore<EarnVaultsState> {

  constructor() {
    super({
      UIState: {
        requestingVaults: false,
        creatingVault: false,
        creatingDeposit: false,
      }
    });
  }

}

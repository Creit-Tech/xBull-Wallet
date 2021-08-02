import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { IWalletsOperation } from './wallets-operation.model';

export interface WalletsOperationsState extends EntityState<IWalletsOperation> {
  UIState: {
    sendingPayment: boolean;
    gettingAccountRecords: boolean;
  };
}

function createInitialState(): WalletsOperationsState {
  return {
    UIState: {
      sendingPayment: false,
      gettingAccountRecords: false,
    }
  };
}

@Injectable({ providedIn: 'root' })
@StoreConfig({
  name: 'wallets-operations',
  idKey: '_id'
})
export class WalletsOperationsStore extends EntityStore<WalletsOperationsState> {

  constructor() {
    super(createInitialState());
  }

  updateUIState(newState: Partial<WalletsOperationsState['UIState']>): void {
    this.update(state => ({
      ...state,
      UIState: {
        ...state.UIState,
        ...newState,
      },
    }));
  }

}

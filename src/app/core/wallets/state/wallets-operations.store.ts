import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { WalletsOperation } from './wallets-operation.model';

export interface WalletsOperationsState extends EntityState<WalletsOperation> {
  sendingPayment: boolean;
}

function createInitialState(): WalletsOperationsState {
  return {
    sendingPayment: false,
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

}

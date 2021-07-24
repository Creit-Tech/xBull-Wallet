import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { IWalletsOperation } from './wallets-operation.model';

export interface WalletsOperationsState extends EntityState<IWalletsOperation> {
  sendingPayment: boolean;
  gettingAccountRecords: boolean;
}

function createInitialState(): WalletsOperationsState {
  return {
    sendingPayment: false,
    gettingAccountRecords: false,
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
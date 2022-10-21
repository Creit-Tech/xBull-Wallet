import { Injectable } from '@angular/core';
import { EntityState, StoreConfig } from '@datorama/akita';
import { BaseEntityStore } from '~root/state/base-entity.store';
import { IWalletConnectSessionModel } from '~root/state/walletconnect-sessions/walletconnect-session.model';

export interface WalletConnectSessionsState extends EntityState<IWalletConnectSessionModel> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({
  name: 'walletconnect-sessions',
  idKey: '_id',
  resettable: true,
})
export class WalletConnectSessionsStore extends BaseEntityStore<WalletConnectSessionsState> {

  constructor() {
    super({});
  }

}

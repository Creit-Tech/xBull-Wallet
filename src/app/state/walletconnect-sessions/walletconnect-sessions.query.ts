import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { WalletConnectSessionsStore, WalletConnectSessionsState } from './walletconnect-sessions.store';

@Injectable({ providedIn: 'root' })
export class WalletConnectSessionsQuery extends QueryEntity<WalletConnectSessionsState> {

  constructor(protected store: WalletConnectSessionsStore) {
    super(store);
  }

}

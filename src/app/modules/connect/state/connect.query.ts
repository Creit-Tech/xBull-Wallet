import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { ConnectStore, ConnectState } from './connect.store';

@Injectable()
export class ConnectQuery extends Query<ConnectState> {
  stateFlow$ = this.select(state => state.UIState.stateFlow);

  openerPublicKey$ = this.select(state => state.openerPublicKey);
  openerSession$ = this.select(state => state.openerSession);
  localSession$ = this.select(state => state.localSession);
  origin$ = this.select(state => state.origin);
  keypair$ = this.select(state => state.keypair);
  startDate$ = this.select(state => state.startDate);

  permissions$ = this.select(state => state.permissions);

  xdr$ = this.select(state => state.xdr);
  message$ = this.select(state => state.message);
  accountIdToUse$ = this.select(state => state.accountIdToUse);
  networkPassphraseToUse$ = this.select(state => state.networkPassphraseToUse);

  constructor(protected store: ConnectStore) {
    super(store);
  }

}

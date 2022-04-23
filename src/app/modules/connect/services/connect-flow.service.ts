import { Injectable } from '@angular/core';
import { ConnectState, ConnectStateFlow, ConnectStore } from '~root/modules/connect/state/connect.store';
import { encodeBase64 } from 'tweetnacl-util';
import { randomBytes } from 'tweetnacl';
import { transaction } from '@datorama/akita';

@Injectable()
export class ConnectFlowService {

  constructor(
    private readonly connectStore: ConnectStore,
  ) { }

  @transaction()
  setInitialState(params: Required<Pick<ConnectState, 'openerSession' | 'openerPublicKey'>>): void {
    this.connectStore.update({
      openerSession: params.openerSession,
      openerPublicKey: params.openerPublicKey,
      startDate: new Date(),
      localSession: encodeBase64(randomBytes(16)),
    });

    this.connectStore.updateUIState({ processStarted: true });
  }

  @transaction()
  setConnectAccountFlow(params: Required<Pick<ConnectState, 'origin' | 'permissions'>>): void {
    this.connectStore.update({
      origin: params.origin,
      permissions: params.permissions,
    });
    this.connectStore.updateUIState({
      stateFlow: ConnectStateFlow.CONNECT,
      processStarted: true,
    });
  }
}

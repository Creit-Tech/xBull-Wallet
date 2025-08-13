import { Injectable } from '@angular/core';
import { transaction } from '@datorama/akita';
import { ConnectState, ConnectStateFlow, ConnectStore } from '~root/modules/connect/state/connect.store';
import { encodeBase64 } from 'tweetnacl-util';
import { randomBytes } from 'tweetnacl';

@Injectable()
export class ConnectService {

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

  @transaction()
  setSignTransaction(params: Required<Pick<ConnectState, 'xdr' | 'origin'>> & Pick<ConnectState, 'accountIdToUse' | 'networkPassphraseToUse'>): void {
    this.connectStore.update({
      xdr: params.xdr,
      origin: params.origin,
      accountIdToUse: params.accountIdToUse,
      networkPassphraseToUse: params.networkPassphraseToUse,
    });

    this.connectStore.updateUIState({
      stateFlow: ConnectStateFlow.SIGN,
      processStarted: true,
    });
  }

  @transaction()
  setSignMessageTransaction(params: Required<Pick<ConnectState, 'message' | 'origin'>> & Pick<ConnectState, 'accountIdToUse' | 'networkPassphraseToUse'>): void {
    this.connectStore.update({
      message: params.message,
      origin: params.origin,
      accountIdToUse: params.accountIdToUse,
      networkPassphraseToUse: params.networkPassphraseToUse,
    });

    this.connectStore.updateUIState({
      stateFlow: ConnectStateFlow.SIGN_MESSAGE,
      processStarted: true,
    });
  }

  rejectRequest(type: EventType): void {
    opener.postMessage({
      type,
      success: false,
    }, '*');
  }
}

export interface IEventData {
  type: EventType;
  message: string; // Encrypted base64
  oneTimeCode: string; // base64
}

export enum EventType {
  XBULL_INITIAL_RESPONSE = 'XBULL_INITIAL_RESPONSE',
  XBULL_CONNECT = 'XBULL_CONNECT',
  XBULL_CONNECT_RESPONSE = 'XBULL_CONNECT_RESPONSE',
  XBULL_SIGN = 'XBULL_SIGN',
  XBULL_SIGN_RESPONSE = 'XBULL_SIGN_RESPONSE',
  XBULL_SIGN_MESSAGE = 'XBULL_SIGN_MESSAGE',
  XBULL_SIGN_MESSAGE_RESPONSE = 'XBULL_SIGN_MESSAGE_RESPONSE',
}

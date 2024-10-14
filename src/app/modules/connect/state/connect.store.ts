import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { BaseStore } from '~root/state/base.store';
import { INetworkApi, ISiteConnection, IWalletsAccount } from '~root/state';
import keyPair = nacl.boxProps.keyPair;
import { box, BoxKeyPair } from 'tweetnacl';
import { encodeBase64 } from 'tweetnacl-util';

export enum ConnectStateFlow {
  START = 'START',
  CONNECT = 'CONNECT',
  SIGN = 'SIGN',
}
export interface ConnectState {
  UIState: {
    processStarted: boolean;
    showLoading: boolean;
    stateFlow: ConnectStateFlow;
  };

  // We could use a simple keypair but akita is giving issues, that's why we use base 64
  keypair: {
    publicKey: string; // Base64
    secretKey: string; // Base64
  };

  localSession?: string; // Base64
  startDate?: Date;
  openerPublicKey?: string; // Base64
  openerSession?: string; // Base64
  origin?: string;

  // Connect flow state
  permissions?: Pick<ISiteConnection, 'canRequestPublicKey' | 'canRequestSign'>;

  // Sign flow state
  xdr?: string;
  accountIdToUse?: IWalletsAccount['_id'];
  networkPassphraseToUse?: INetworkApi['networkPassphrase'];
}

export function createInitialState(): ConnectState {
  const keypair = box.keyPair();
  return {
    UIState: {
      processStarted: false,
      showLoading: false,
      stateFlow: ConnectStateFlow.START,
    },
    keypair: {
      publicKey: encodeBase64(keypair.publicKey),
      secretKey: encodeBase64(keypair.secretKey),
    },
  };
}

@Injectable()
@StoreConfig({ name: 'connect' })
export class ConnectStore extends BaseStore<ConnectState> {

  constructor() {
    super(createInitialState());
  }

}

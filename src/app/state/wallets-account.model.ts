import { ServerApi } from 'stellar-sdk';
import { IWallet } from '~root/state/wallet.model';

export const walletsAccountDocVersion = 1;

export interface IWalletsAccountBase  {
  _id: string; // this is a hashed string from the public key and the network passphrase
  publicKey: string;
  isCreated: boolean;
  accountRecord?: ServerApi.AccountRecord;
  streamCreated: boolean;
  operationsStreamCreated: boolean;
  name: string;
  walletId: IWallet['_id'];
  docVersion: number;
}

export interface IWalletsAccountWithSecretKey extends IWalletsAccountBase {
  type: 'with_secret_key';
  secretKey: string;
}

export interface IWalletsAccountLedger extends IWalletsAccountBase {
  type: 'with_ledger_wallet';
  path: string;
}


export interface IWalletsAccountTrezor extends IWalletsAccountBase {
  type: 'with_trezor_wallet';
  path: string;
}

export type IWalletsAccount = IWalletsAccountWithSecretKey | IWalletsAccountLedger | IWalletsAccountTrezor;

export function createWalletsAccount(params: IWalletsAccount): IWalletsAccount {
  const base: IWalletsAccountBase = {
    _id: params._id,
    publicKey: params.publicKey,
    isCreated: params.isCreated,
    // We do a stringify and parse to remove all functions in the stellar object
    accountRecord: params.accountRecord && JSON.parse(JSON.stringify(params.accountRecord)),
    streamCreated: params.streamCreated,
    operationsStreamCreated: params.operationsStreamCreated,
    name: params.name,
    walletId: params.walletId,
    docVersion: walletsAccountDocVersion
  };

  switch (params.type) {
    case 'with_secret_key':
      return {
        ...base,
        type: params.type,
        secretKey: params.secretKey,
      };

    case 'with_ledger_wallet':
    case 'with_trezor_wallet':
      return {
        ...base,
        type: params.type,
        path: params.path,
      };
  }
}

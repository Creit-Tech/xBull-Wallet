import { ServerApi } from 'stellar-sdk';
import { IWallet } from '~root/state/wallet.model';

export interface IWalletsAccount  {
  _id: string; // this is the public key
  secretKey: string;
  isCreated: boolean;
  accountRecord?: ServerApi.AccountRecord;
  streamCreated: boolean;
  operationsStreamCreated: boolean;
  name: string;
  walletId: IWallet['_id'];
}

export function createWalletsAccount(params: IWalletsAccount): IWalletsAccount {
  return {
    _id: params._id,
    secretKey: params.secretKey,
    isCreated: params.isCreated,
    accountRecord: params.accountRecord,
    streamCreated: params.streamCreated,
    operationsStreamCreated: params.operationsStreamCreated,
    name: params.name,
    walletId: params.walletId,
  };
}

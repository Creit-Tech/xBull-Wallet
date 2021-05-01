import { ServerApi } from 'stellar-sdk';

export interface IWalletsAccount  {
  _id: string;
  secretKey: string;
  isCreated: boolean;
  accountRecord?: ServerApi.AccountRecord;
}

export function createWalletsAccount(params: IWalletsAccount): IWalletsAccount {
  return {
    _id: params._id,
    secretKey: params.secretKey,
    isCreated: params.isCreated,
  };
}

import { ServerApi } from 'stellar-sdk';

export interface IAccount {
  publicKey: string;
  privateKey: string;
  stellarAccount?: ServerApi.AccountRecord;
}

export function createAccount(params: IAccount): IAccount {
  return {
    publicKey: params.publicKey,
    privateKey: params.privateKey,
    stellarAccount: params.stellarAccount
  };
}

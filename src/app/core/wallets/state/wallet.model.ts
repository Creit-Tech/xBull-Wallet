import { ServerApi } from 'stellar-sdk';

export interface IWalletAccount {
  publicKey: string;
  privateKey: string;
  stellarAccount?: ServerApi.AccountRecord;
}

export interface IBaseWallet {
  _id: number;
  name: string;
  accounts: IWalletAccount[];
}

export interface IWalletWithMnemonicPhrase extends IBaseWallet {
  type: 'mnemonic_phrase';
  mnemonicPhrase: string;
}

export type IWallet = IWalletWithMnemonicPhrase;

export function createWallet(params: IWallet): IWallet {
  return {
    _id: params._id,
    name: params.name,
    type: params.type,
    mnemonicPhrase: params.mnemonicPhrase,
    accounts: params.accounts || [],
  };
}

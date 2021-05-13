export interface IBaseWallet {
  _id: number;
  name: string;
}

export interface IWalletWithMnemonicPhrase extends IBaseWallet {
  type: 'mnemonic_phrase';
  mnemonicPhrase: string;
}

// This is because we want to support more kind of wallets in the future like Trezor wallets, ledger, etc
export type IWallet = IWalletWithMnemonicPhrase;

export function createWallet(params: IWallet): IWallet {
  return {
    _id: params._id,
    name: params.name,
    type: params.type,
    mnemonicPhrase: params.mnemonicPhrase,
  };
}

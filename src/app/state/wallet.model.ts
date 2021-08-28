export interface IBaseWallet {
  _id: string;
  name: string;
}

export interface IWalletWithMnemonicPhrase extends IBaseWallet {
  type: 'mnemonic_phrase';
  mnemonicPhrase: string;
}

export interface IWalletWithSecretKey extends IBaseWallet {
  type: 'secret_key';
}

// This is because we want to support more kind of wallets in the future like Trezor wallets, ledger, etc
export type IWallet = IWalletWithMnemonicPhrase | IWalletWithSecretKey;

export function createWallet(params: IWallet): IWallet {

  switch (params.type) {
    case 'mnemonic_phrase':
      return {
        _id: params._id,
        name: params.name,
        type: params.type,
        mnemonicPhrase: params.mnemonicPhrase,
      };

    case 'secret_key':
      return {
        _id: params._id,
        name: params.name,
        type: params.type,
      };
  }
}

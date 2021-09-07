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

export interface IWalletWithLedger extends IBaseWallet {
  type: 'ledger_wallet';
  productId: number;
  vendorId: number;
}

export interface IWalletWithTrezor extends IBaseWallet {
  type: 'trezor_wallet';
}

export type IWallet = IWalletWithMnemonicPhrase | IWalletWithSecretKey | IWalletWithLedger | IWalletWithTrezor;

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

    case 'ledger_wallet':
      return {
        _id: params._id,
        name: params.name,
        type: params.type,
        vendorId: params.vendorId,
        productId: params.productId,
      };

    case 'trezor_wallet':
      return {
        _id: params._id,
        name: params.name,
        type: params.type,
      };
  }
}

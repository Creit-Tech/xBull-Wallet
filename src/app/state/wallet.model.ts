export interface IBaseWallet {
  _id: string;
  name: string;
}

export interface IWalletWithMnemonicPhrase extends IBaseWallet {
  type: WalletType.mnemonic_phrase;
  mnemonicPhrase: string;
}

export interface IWalletWithSecretKey extends IBaseWallet {
  type: WalletType.secret_key;
}

export interface IWalletWithLedger extends IBaseWallet {
  type: WalletType.ledger_wallet;
  productId: number;
  vendorId: number;
}

export interface IWalletWithTrezor extends IBaseWallet {
  type: WalletType.trezor_wallet;
}

export interface IWalletWithAirGapped extends IBaseWallet {
  type: WalletType.air_gapped;
  protocol: AirGappedWalletProtocol;
  deviceId?: string;
}

export type IWallet = IWalletWithMnemonicPhrase | IWalletWithSecretKey | IWalletWithLedger | IWalletWithTrezor | IWalletWithAirGapped;

export function createWallet(params: IWallet): IWallet {

  switch (params.type) {
    case WalletType.mnemonic_phrase:
      return {
        _id: params._id,
        name: params.name,
        type: params.type,
        mnemonicPhrase: params.mnemonicPhrase,
      };

    case WalletType.secret_key:
      return {
        _id: params._id,
        name: params.name,
        type: params.type,
      };

    case WalletType.ledger_wallet:
      return {
        _id: params._id,
        name: params.name,
        type: params.type,
        vendorId: params.vendorId,
        productId: params.productId,
      };

    case WalletType.trezor_wallet:
      return {
        _id: params._id,
        name: params.name,
        type: params.type,
      };

    case WalletType.air_gapped:
      return {
        _id: params._id,
        name: params.name,
        type: params.type,
        protocol: params.protocol,
        deviceId: params.deviceId,
      };
  }
}

export enum WalletType {
  mnemonic_phrase = 'mnemonic_phrase',
  secret_key = 'secret_key',
  ledger_wallet = 'ledger_wallet',
  trezor_wallet = 'trezor_wallet',
  air_gapped = 'air_gapped',
}

export enum AirGappedWalletProtocol {
  LumenSigner = 'LumenSigner',
  KeyStone = 'KeyStone',
}

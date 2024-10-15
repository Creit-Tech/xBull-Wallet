import { Injectable } from '@angular/core';
import { createHash, randomBytes } from 'crypto';

import { CryptoService } from '~root/core/crypto/services/crypto.service';
import {
  AirGappedWalletProtocol,
  createWallet,
  createWalletsAccount,
  HorizonApisQuery,
  INetworkApi,
  IWallet,
  IWalletsAccount,
  IWalletsAccountAirGapped,
  IWalletsAccountLedger,
  IWalletsAccountTrezor,
  IWalletsAccountWithSecretKey,
  WalletAccountType,
  WalletsAccountsQuery,
  WalletsAccountsStore,
  WalletsOperationsStore,
  WalletsStore,
  WalletType,
} from '~root/state';
import { MnemonicPhraseService } from '~root/core/wallets/services/mnemonic-phrase.service';
import { transaction } from '@datorama/akita';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import { Horizon, Keypair, Memo, Networks, Operation, Transaction } from 'stellar-sdk';

@Injectable({
  providedIn: 'root'
})
export class WalletsService {

  constructor(
    private readonly walletsStore: WalletsStore,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly walletsAccountsStore: WalletsAccountsStore,
    private readonly cryptoService: CryptoService,
    private readonly mnemonicPhraseService: MnemonicPhraseService,
    private readonly horizonApisQuery: HorizonApisQuery,
    private readonly stellarSdkService: StellarSdkService,
    private readonly walletsOperationsStore: WalletsOperationsStore,
  ) { }

  generateLedgerWalletId(params: { productId: number; vendorId: number }): string {
    return `${params.productId}_${params.vendorId}`;
  }

  generateWalletAccountId(params: { network: Networks; publicKey: string }): string {
    return createHash('md5')
      .update(`${params.network}_${params.publicKey}`)
      .digest('hex');
  }

  async createNewAccount(params: INewAccountType): Promise<Keypair> {
    let newWalletAccount: Omit<IWalletsAccount, '_id'>;
    let keypair: Keypair;

    const baseAccount: Omit<IWalletsAccount, '_id' | 'publicKey' | 'type' | 'docVersion'> = {
      streamCreated: false,
      name: randomBytes(4).toString('hex'),
      walletId: params.walletId,
      operationsStreamCreated: false,
      isCreated: false,
    };

    switch (params.type) {
      case WalletType.mnemonic_phrase:
        keypair = await this.mnemonicPhraseService.getKeypairFromMnemonicPhrase(params.mnemonicPhrase, params.path);
        newWalletAccount = {
          ...baseAccount,
          type: WalletAccountType.with_secret_key,
          publicKey: keypair.publicKey(),
          secretKey: this.cryptoService.encryptText(keypair.secret(), params.password),
        } as IWalletsAccountWithSecretKey;
        break;

      case WalletType.secret_key:
        keypair = Keypair.fromSecret(params.secretKey);
        newWalletAccount = {
          ...baseAccount,
          type: WalletAccountType.with_secret_key,
          publicKey: keypair.publicKey(),
          secretKey: this.cryptoService.encryptText(keypair.secret(), params.password),
        } as IWalletsAccountWithSecretKey;
        break;

      case WalletType.ledger_wallet:
        keypair = Keypair.fromPublicKey(params.publicKey);
        newWalletAccount = {
          ...baseAccount,
          type: WalletAccountType.with_ledger_wallet,
          publicKey: keypair.publicKey(),
          path: params.path,
        } as IWalletsAccountLedger;
        break;

      case WalletType.trezor_wallet:
        keypair = Keypair.fromPublicKey(params.publicKey);
        newWalletAccount = {
          ...baseAccount,
          type: 'with_trezor_wallet',
          publicKey: keypair.publicKey(),
          path: params.path,
        } as IWalletsAccountTrezor;
        break;

      case WalletType.air_gapped:
        keypair = Keypair.fromPublicKey(params.publicKey);
        newWalletAccount = {
          ...baseAccount,
          publicKey: keypair.publicKey(),
          type: WalletAccountType.with_air_gapped,
          path: params.path,
        } as IWalletsAccountAirGapped;
        break;

      default:
        throw new Error(`We can not handle the type: ${(params as any).type}`);
    }

    const walletAccounts = Object.values(Networks)
      .map(network =>
        createWalletsAccount({
          _id: this.generateWalletAccountId({ network, publicKey: keypair.publicKey() }),
          ...(newWalletAccount as any)
        })
      );

    this.walletsAccountsStore.upsertMany(Object.values(walletAccounts));
    return keypair;
  }

  @transaction()
  async generateNewWallet(params: INewWalletType): Promise<string> {
    const activeHorizonApi = this.horizonApisQuery.getActive() as INetworkApi;
    let newWalletId: string;
    let newWallet: IWallet;
    let keypair: Keypair;
    let keypairs: Keypair[];

    switch (params.type) {
      case WalletType.mnemonic_phrase:
        newWalletId = randomBytes(4).toString('hex');
        newWallet = createWallet({
          _id: newWalletId,
          type: WalletType.mnemonic_phrase,
          name: newWalletId,
          mnemonicPhrase: this.cryptoService.encryptText(params.mnemonicPhrase, params.password),
        });
        this.walletsStore.upsert(newWallet._id, newWallet);
        keypair = await this.createNewAccount({
          ...params,
          walletId: newWalletId,
        });
        break;

      case WalletType.secret_key:
        newWalletId = randomBytes(4).toString('hex');
        newWallet = createWallet({
          _id: newWalletId,
          type: WalletType.secret_key,
          name: newWalletId,
        });
        this.walletsStore.upsert(newWallet._id, newWallet);
        keypair = await this.createNewAccount({
          ...params,
          walletId: newWalletId,
        });
        break;

      case WalletType.ledger_wallet:
        newWalletId = this.generateLedgerWalletId(params);
        newWallet = createWallet({
          _id: newWalletId,
          type: WalletType.ledger_wallet,
          name: newWalletId,
          vendorId: params.vendorId,
          productId: params.productId,
        });
        this.walletsStore.upsert(newWallet._id, newWallet);
        keypairs = await Promise.all(params.accounts.map(account => {
          return this.createNewAccount({
            ...params,
            ...account,
            walletId: newWalletId,
          });
        }));
        keypair = keypairs.shift() as Keypair;
        break;

      case WalletType.trezor_wallet:
        newWalletId = params.walletId;
        newWallet = createWallet({
          _id: newWalletId,
          type: WalletType.trezor_wallet,
          name: newWalletId,
        });
        this.walletsStore.upsert(newWallet._id, newWallet);
        keypairs = await Promise.all(params.accounts.map(account => {
          return this.createNewAccount({
            ...params,
            ...account,
            walletId: newWalletId,
          });
        }));
        keypair = keypairs.shift() as Keypair;
        break;

      case WalletType.air_gapped:
        newWalletId = randomBytes(4).toString('hex');
        newWallet = createWallet({
          _id: newWalletId,
          name: newWalletId,
          type: WalletType.air_gapped,
          protocol: params.protocol,
          deviceId: params.deviceId,
        });
        this.walletsStore.upsert(newWallet._id, newWallet);
        keypairs = await Promise.all(params.accounts.map(account => {
          return this.createNewAccount({
            ...params,
            ...account,
            walletId: newWalletId,
          });
        }));
        keypair = keypairs.shift() as Keypair;
        break;

      default:
        throw new Error(`Can't handle wallet type`);
    }

    this.walletsStore.setActive(newWallet._id);
    this.walletsAccountsStore.setActive(
      createHash('md5')
        .update(`${activeHorizonApi.networkPassphrase}_${keypair.publicKey()}`)
        .digest('hex')
    );

    return keypair.publicKey();
  }

  @transaction()
  selectAccount(params: { publicKey: IWalletsAccount['publicKey']; walletId: IWallet['_id']; }): void {
    const activeHorizonApi = this.horizonApisQuery.getActive() as INetworkApi;
    this.walletsStore.setActive(params.walletId);
    this.walletsAccountsStore.setActive(
      createHash('md5')
        .update(`${activeHorizonApi.networkPassphrase}_${params.publicKey}`)
        .digest('hex')
    );
  }

  updateWalletName(walletId: IWallet['_id'], name: string): void {
    this.walletsStore.upsert(walletId, { name });
  }

  async removeWallets(walletId: Array<IWallet['_id']>): Promise<void> {
    this.walletsStore.remove(walletId);
  }

  parseMemo(memo: Memo): string | undefined {
    if (!memo.value) {
      return;
    }

    return Buffer.from(memo.value).toString();
  }

  async sendPayment(xdr: Transaction): Promise<void> {
    this.walletsOperationsStore.updateUIState({ sendingPayment: true });
    return this.stellarSdkService.submit(xdr)
      .then(response => {
        this.walletsOperationsStore.updateUIState({ sendingPayment: false });
        return response;
      })
      .catch(error => {
        this.walletsOperationsStore.updateUIState({ sendingPayment: false });
        return Promise.reject(error);
      });
  }

  /*
   * This method takes all accounts and checks which ones of them do not have all of the networks variations so it creates them
   */
  @transaction()
  async addMissingAccountsForSoroban(): Promise<void> {
    const allAccounts = this.walletsAccountsQuery.getAll();
    for (const account of allAccounts) {
      const futurenetId = this.generateWalletAccountId({ network: Networks.FUTURENET, publicKey: account.publicKey });
      const standaloneId = this.generateWalletAccountId({ network: Networks.STANDALONE, publicKey: account.publicKey });
      const sandboxId = this.generateWalletAccountId({ network: Networks.SANDBOX, publicKey: account.publicKey });
      const { _id, ...rest } = account;
      this.walletsAccountsStore.upsertMany([
        { _id: futurenetId, ...rest },
        { _id: standaloneId, ...rest },
        { _id: sandboxId, ...rest },
      ]);
    }
  }

  updatePasswordIsSet(): void {
    this.walletsStore.update({ passwordSet: true });
  }

  /**
   * This function tries to decrypt one of the encrypted values to confirm the password provided is the correct one.
   */
  validatePassword(password: string): boolean {
    const state = this.walletsAccountsQuery.getValue();
    if (!!state.entities) {
      const account: IWalletsAccountWithSecretKey | undefined = Object.values(state.entities)
        .find(w => w.type === 'with_secret_key' && !!w.secretKey) as IWalletsAccountWithSecretKey | undefined;
      if (!account) return true;

      try {
        this.cryptoService.decryptText(account.secretKey, password);
        return true;
      } catch (e) {
        return false;
      }
    }

    return true;
  }
}

export type INewAccountType = INewAccountMnemonicPhraseType
  | INewAccountSecretKeyType
  | INewAccountLedgerType
  | INewAccountTrezorType
  | INewAccountAirgappedType;

export interface INewAccountMnemonicPhraseType {
  type: WalletType.mnemonic_phrase;
  mnemonicPhrase: string;
  path?: string;
  walletId: IWallet['_id'];
  password: string;
}

export interface INewAccountSecretKeyType {
  type: WalletType.secret_key;
  secretKey: string;
  walletId: IWallet['_id'];
  password: string;
}

export interface INewAccountLedgerType {
  type: WalletType.ledger_wallet;
  path: string;
  publicKey: string;
  walletId: IWallet['_id'];
}

export interface INewAccountTrezorType {
  type: WalletType.trezor_wallet;
  path: string;
  publicKey: string;
  walletId: IWallet['_id'];
}

export interface INewAccountAirgappedType {
  type: WalletType.air_gapped;
  path: string;
  publicKey: string;
  walletId: IWallet['_id'];
  protocol: string;
}

export type INewWalletType = INewWalletMnemonicPhraseType
  | INewWalletSecretKeyType
  | INewWalletLedgerType
  | INewWalletTrezorType
  | INewWalletAirgappedType;

export interface INewWalletMnemonicPhraseType {
  type: WalletType.mnemonic_phrase;
  mnemonicPhrase: string;
  path?: string;
  password: string;
}

export interface INewWalletSecretKeyType {
  type: WalletType.secret_key;
  secretKey: string;
  password: string;
}

export interface INewWalletLedgerType {
  productId: number;
  vendorId: number;
  type: WalletType.ledger_wallet;
  accounts: Array<{
    publicKey: string;
    path: string;
  }>;
}

export interface INewWalletTrezorType {
  walletId: string;
  type: WalletType.trezor_wallet;
  accounts: Array<{
    publicKey: string;
    path: string;
  }>;
}

export interface INewWalletAirgappedType {
  protocol: AirGappedWalletProtocol;
  type: WalletType.air_gapped;

  // The device id is the fingerprint used in KeyStone devices
  deviceId?: string;

  accounts: Array<{
    publicKey: string;
    path: string;
  }>;
}

export interface ITransaction {
  baseAccount: string;
  sequence: string;
  source: string;
  passphrase: string;
  operations: Operation[];
  fee: string;
  memo?: string;
}

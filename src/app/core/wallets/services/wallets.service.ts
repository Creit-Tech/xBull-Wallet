import { Injectable } from '@angular/core';
import { Keypair, Memo, Networks, Operation, Transaction } from 'stellar-base';
import { randomBytes, createHash } from 'crypto';

import { CryptoService } from '~root/core/crypto/services/crypto.service';
import {
  createWallet,
  createWalletsAccount,
  HorizonApisQuery,
  IHorizonApi,
  IWallet,
  IWalletsAccount,
  IWalletsAccountLedger, IWalletsAccountTrezor,
  IWalletsAccountWithSecretKey,
  WalletsAccountsStore,
  WalletsOperationsStore,
  WalletsStore,
} from '~root/state';
import { MnemonicPhraseService } from '~root/core/wallets/services/mnemonic-phrase.service';
import { transaction } from '@datorama/akita';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import { Horizon, ServerApi } from 'stellar-sdk';

@Injectable({
  providedIn: 'root'
})
export class WalletsService {
  // TODO: Think a better way of doing this
  private handledOperations: Array<string> = [
    'createAccount',
    'payment',
    'pathPaymentStrictReceive',
    'pathPaymentStrictSend',
    'createPassiveSellOffer',
    'manageSellOffer',
    'manageBuyOffer',
    'setOptions',
    'changeTrust',
    'allowTrust',
    'accountMerge',
    'inflation',
    'manageData',
    'bumpSequence',
    'createClaimableBalance',
    'claimClaimableBalance',
    'beginSponsoringFutureReserves',
    'endSponsoringFutureReserves',
    'revokeAccountSponsorship',
    'revokeTrustlineSponsorship',
    'revokeOfferSponsorship',
    'revokeDataSponsorship',
    'revokeClaimableBalanceSponsorship',
    'revokeLiquidityPoolSponsorship',
    'revokeSignerSponsorship',
    'clawback',
    'clawbackClaimableBalance',
    'setTrustLineFlags',
    'liquidityPoolDeposit',
    'liquidityPoolWithdraw',
  ];

  constructor(
    private readonly walletsStore: WalletsStore,
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
    let newWalletAccounts: { mainnet: IWalletsAccount; testnet: IWalletsAccount };
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
      case 'mnemonic_phrase':
        keypair = await this.mnemonicPhraseService.getKeypairFromMnemonicPhrase(params.mnemonicPhrase, params.path);
        newWalletAccount = {
          ...baseAccount,
          type: 'with_secret_key',
          publicKey: keypair.publicKey(),
          secretKey: this.cryptoService.encryptText(keypair.secret(), params.password),
        } as IWalletsAccountWithSecretKey;
        break;

      case 'secret_key':
        keypair = Keypair.fromSecret(params.secretKey);
        newWalletAccount = {
          ...baseAccount,
          type: 'with_secret_key',
          publicKey: keypair.publicKey(),
          secretKey: this.cryptoService.encryptText(keypair.secret(), params.password),
        } as IWalletsAccountWithSecretKey;
        break;

      case 'ledger_wallet':
        keypair = Keypair.fromPublicKey(params.publicKey);
        newWalletAccount = {
          ...baseAccount,
          type: 'with_ledger_wallet',
          publicKey: keypair.publicKey(),
          path: params.path,
        } as IWalletsAccountLedger;
        break;

      case 'trezor_wallet':
        keypair = Keypair.fromPublicKey(params.publicKey);
        newWalletAccount = {
          ...baseAccount,
          type: 'with_trezor_wallet',
          publicKey: keypair.publicKey(),
          path: params.path,
        } as IWalletsAccountTrezor;
        break;

      default:
        throw new Error(`We can not handle the type: ${(params as any).type}`);
    }


    newWalletAccounts = {
      mainnet: createWalletsAccount({
        _id: createHash('md5')
          .update(`${Networks.PUBLIC}_${keypair.publicKey()}`)
          .digest('hex'),
        ...(newWalletAccount as any)
      }),
      testnet: createWalletsAccount({
        _id: createHash('md5')
          .update(`${Networks.TESTNET}_${keypair.publicKey()}`)
          .digest('hex'),
        ...(newWalletAccount as any)
      }),
    };

    this.walletsAccountsStore.upsertMany(Object.values(newWalletAccounts));
    return keypair;
  }

  @transaction()
  async generateNewWallet(params: INewWalletType): Promise<string> {
    const activeHorizonApi = this.horizonApisQuery.getActive() as IHorizonApi;
    let newWalletId: string;
    let newWallet: IWallet;
    let keypair: Keypair;
    let keypairs: Keypair[];

    switch (params.type) {
      case 'mnemonic_phrase':
        newWalletId = randomBytes(4).toString('hex');
        newWallet = createWallet({
          _id: newWalletId,
          type: 'mnemonic_phrase',
          name: newWalletId,
          mnemonicPhrase: this.cryptoService.encryptText(params.mnemonicPhrase, params.password),
        });
        this.walletsStore.upsert(newWallet._id, newWallet);
        keypair = await this.createNewAccount({
          ...params,
          walletId: newWalletId,
        });
        break;

      case 'secret_key':
        newWalletId = randomBytes(4).toString('hex');
        newWallet = createWallet({
          _id: newWalletId,
          type: 'secret_key',
          name: newWalletId,
        });
        this.walletsStore.upsert(newWallet._id, newWallet);
        keypair = await this.createNewAccount({
          ...params,
          walletId: newWalletId,
        });
        break;

      case 'ledger_wallet':
        newWalletId = this.generateLedgerWalletId(params);
        newWallet = createWallet({
          _id: newWalletId,
          type: 'ledger_wallet',
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

      case 'trezor_wallet':
        newWalletId = params.walletId;
        newWallet = createWallet({
          _id: newWalletId,
          type: 'trezor_wallet',
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
  async selectAccount(params: { publicKey: IWalletsAccount['publicKey']; walletId: IWallet['_id']; }): Promise<void> {
    const activeHorizonApi = this.horizonApisQuery.getActive() as IHorizonApi;
    this.walletsStore.setActive(params.walletId);
    this.walletsAccountsStore.setActive(
      createHash('md5')
        .update(`${activeHorizonApi.networkPassphrase}_${params.publicKey}`)
        .digest('hex')
    );
  }

  savePasswordHash(password: string): void {
    const hash = this.cryptoService.hashPassword(password);
    this.walletsStore.update(state => ({
      ...state,
      globalPasswordHash: hash,
    }));
  }

  updateWalletName(walletId: IWallet['_id'], name: string): void {
    this.walletsStore.upsert(walletId, { name });
  }

  async removeWallets(walletId: Array<IWallet['_id']>): Promise<void> {
    this.walletsStore.remove(walletId);
  }

  checkIfAllOperationsAreHandled(operations: Operation[]): true {
    for (const operation of operations) {
      if (this.handledOperations.indexOf(operation.type) === -1) {
        throw new Error(`Operation type "${operation.type}" is not handled by this wallet yet.`);
      }
    }

    return true;

  }

  parseMemo(memo: Memo): string | undefined {
    if (!memo.value) {
      return;
    }

    return Buffer.from(memo.value).toString();
  }

  parseFromXDRToTransactionInterface(xdr: string): Transaction {
    return new Transaction(xdr, this.stellarSdkService.networkPassphrase);
  }

  sendPayment(xdr: string): Promise<Horizon.SubmitTransactionResponse> {
    this.walletsOperationsStore.updateUIState({ sendingPayment: true });
    return this.stellarSdkService.submitTransaction(xdr)
      .then(response => {
        this.walletsOperationsStore.updateUIState({ sendingPayment: false });
        return response;
      })
      .catch(error => {
        this.walletsOperationsStore.updateUIState({ sendingPayment: false });
        return Promise.reject(error);
      });
  }
}

export type INewAccountType = INewAccountMnemonicPhraseType | INewAccountSecretKeyType | INewAccountLedgerType | INewAccountTrezorType;

export interface INewAccountMnemonicPhraseType {
  type: 'mnemonic_phrase';
  mnemonicPhrase: string;
  path?: string;
  walletId: IWallet['_id'];
  password: string;
}

export interface INewAccountSecretKeyType {
  type: 'secret_key';
  secretKey: string;
  walletId: IWallet['_id'];
  password: string;
}

export interface INewAccountLedgerType {
  type: 'ledger_wallet';
  path: string;
  publicKey: string;
  walletId: IWallet['_id'];
}

export interface INewAccountTrezorType {
  type: 'trezor_wallet';
  path: string;
  publicKey: string;
  walletId: IWallet['_id'];
}

export type INewWalletType = INewWalletMnemonicPhraseType | INewWalletSecretKeyType | INewWalletLedgerType | INewWalletTrezorType;

export interface INewWalletMnemonicPhraseType {
  type: 'mnemonic_phrase';
  mnemonicPhrase: string;
  path?: string;
  password: string;
}

export interface INewWalletSecretKeyType {
  type: 'secret_key';
  secretKey: string;
  password: string;
}

export interface INewWalletLedgerType {
  productId: number;
  vendorId: number;
  type: 'ledger_wallet';
  accounts: Array<{
    publicKey: string;
    path: string;
  }>;
}

export interface INewWalletTrezorType {
  walletId: string;
  type: 'trezor_wallet';
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

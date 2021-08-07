import { Injectable } from '@angular/core';
import { Keypair, Memo, Networks, Operation, Transaction } from 'stellar-base';
import { randomBytes, createHash } from 'crypto';

import { CryptoService } from '~root/core/crypto/services/crypto.service';
import {
  createWallet,
  createWalletsAccount,
  HorizonApisQuery, IHorizonApi,
  IWallet,
  IWalletsAccount,
  WalletsAccountsStore, WalletsOperationsStore,
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
  private handledOperations: Array<Operation['type']> = [
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
    // 'createClaimableBalance',
    // 'claimClaimableBalance',
    'beginSponsoringFutureReserves',
    'endSponsoringFutureReserves',
    // 'revokeSponsorship',
    // 'clawback',
    // 'clawbackClaimableBalance',
    'setTrustLineFlags',
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

  async createNewAccount(params: INewAccountType): Promise<Keypair> {
    let newWalletAccounts: { mainnet: IWalletsAccount; testnet: IWalletsAccount };
    let keypair: Keypair;

    switch (params.type) {
      case 'mnemonic_phrase':
        keypair = await this.mnemonicPhraseService.getKeypairFromMnemonicPhrase(params.mnemonicPhrase, params.path);
        const newWalletAccount: Omit<IWalletsAccount, '_id'> = {
          publicKey: keypair.publicKey(),
          secretKey: this.cryptoService.encryptText(keypair.secret(), params.password),
          streamCreated: false,
          name: randomBytes(4).toString('hex'),
          walletId: params.walletId,
          operationsStreamCreated: false,
          isCreated: false,
        };

        newWalletAccounts = {
          mainnet: createWalletsAccount({
            _id: createHash('md5')
              .update(`${Networks.PUBLIC}_${keypair.publicKey()}`)
              .digest('hex'),
            ...newWalletAccount
          }),
          testnet: createWalletsAccount({
            _id: createHash('md5')
              .update(`${Networks.TESTNET}_${keypair.publicKey()}`)
              .digest('hex'),
            ...newWalletAccount
          }),
        };

        this.walletsAccountsStore.upsertMany(Object.values(newWalletAccounts));
        break;

      default:
        throw new Error(`We can not handle the type: ${params.type}`);
    }

    return keypair;
  }

  async generateNewWallet(params: INewWalletType): Promise<string> {
    const activeHorizonApi = this.horizonApisQuery.getActive() as IHorizonApi;
    const newWalletId: string = randomBytes(4).toString('hex');
    let newWallet: IWallet;
    let keypair: Keypair;

    switch (params.type) {
      case 'mnemonic_phrase':
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

  parseFromXDRToTransactionInterface(xdr: string): ITransaction {
    const createdTransaction = new Transaction(xdr, this.stellarSdkService.networkPassphrase);
    return {
      fee: createdTransaction.fee,
      baseAccount: createdTransaction.source,
      operations: createdTransaction.operations,
      passphrase: createdTransaction.networkPassphrase,
      memo: this.parseMemo(createdTransaction.memo),
    };
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

export type INewAccountType = INewAccountMnemonicPhraseType;

export interface INewAccountMnemonicPhraseType {
  type: 'mnemonic_phrase';
  mnemonicPhrase: string;
  path?: string;
  walletId: IWallet['_id'];
  password: string;
}

export type INewWalletType = INewWalletMnemonicPhraseType;

export interface INewWalletMnemonicPhraseType {
  type: 'mnemonic_phrase';
  mnemonicPhrase: string;
  path?: string;
  password: string;
}

export interface ITransaction {
  baseAccount: string;
  passphrase: string;
  operations: Operation[];
  fee: string;
  memo?: string;
}

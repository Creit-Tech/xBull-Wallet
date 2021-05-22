import { Injectable } from '@angular/core';
import { Keypair } from 'stellar-base';

import { CryptoService } from '~root/core/crypto/services/crypto.service';
import { createWallet, createWalletsAccount, IWallet, IWalletsAccount, WalletsAccountsStore, WalletsStore } from '~root/core/wallets/state';
import { MnemonicPhraseService } from '~root/core/wallets/services/mnemonic-phrase.service';

@Injectable({
  providedIn: 'root'
})
export class WalletsService {

  constructor(
    private readonly walletsStore: WalletsStore,
    private readonly walletsAccountsStore: WalletsAccountsStore,
    private readonly cryptoService: CryptoService,
    private readonly mnemonicPhraseService: MnemonicPhraseService,
  ) { }

  async generateNewWallet(params: INewWalletType): Promise<string> {
    let keypair: Keypair;
    let newWallet: IWallet;
    let newWalletAccount: IWalletsAccount;
    const newWalletId: number = this.walletsStore.getValue().ids?.length || 0;

    switch (params.type) {
      case 'mnemonic_phrase':
        keypair = await this.mnemonicPhraseService.getKeypairFromMnemonicPhrase(params.mnemonicPhrase, params.path);
        newWallet = createWallet({
          _id: newWalletId,
          type: 'mnemonic_phrase',
          name: `Wallet ${newWalletId}`,
          mnemonicPhrase: this.cryptoService.encryptText(params.mnemonicPhrase, params.password),
        });

        newWalletAccount = createWalletsAccount({
          _id: keypair.publicKey(),
          secretKey: this.cryptoService.encryptText(keypair.secret(), params.password),
          streamCreated: false,
          operationsStreamCreated: false,
          isCreated: false,  // We assume all accounts aren't created but then if it's actually created, we just set it correctly
        });

        this.walletsStore.upsert(newWallet._id, newWallet);
        this.walletsAccountsStore.upsert(newWalletAccount._id, newWalletAccount);
        break;

      default:
        throw new Error(`Can't handle wallet type`);
    }

    this.walletsStore.setActive(newWallet._id);
    this.walletsAccountsStore.setActive(newWalletAccount._id);

    return keypair.publicKey();
  }

  savePasswordHash(password: string): void {
    const hash = this.cryptoService.hashPassword(password);
    this.walletsStore.update(state => ({
      ...state,
      globalPasswordHash: hash,
    }));
  }
}

export type INewWalletType = INewWalletMnemonicPhraseType;

export interface INewWalletMnemonicPhraseType {
  type: 'mnemonic_phrase';
  mnemonicPhrase: string;
  password: string;
  path?: string;
}

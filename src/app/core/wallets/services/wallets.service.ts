import { Injectable } from '@angular/core';
import { Keypair } from 'stellar-base';

import { CryptoService } from '~root/core/crypto/services/crypto.service';
import { IWallet, WalletsStore } from '~root/core/wallets/state';
import { MnemonicPhraseService } from '~root/core/wallets/services/mnemonic-phrase.service';

@Injectable({
  providedIn: 'root'
})
export class WalletsService {

  constructor(
    private readonly walletsStore: WalletsStore,
    private readonly cryptoService: CryptoService,
    private readonly mnemonicPhraseService: MnemonicPhraseService,
  ) { }

  async generateNewWallet(params: INewWalletType): Promise<string> {
    let keypair: Keypair;
    let newWallet: IWallet;
    const newWalletId: number = this.walletsStore.getValue().ids?.length || 0;

    switch (params.type) {
      case 'mnemonic_phrase':
        keypair = await this.mnemonicPhraseService.getKeypairFromMnemonicPhrase(params.mnemonicPhrase, params.path);
        newWallet = {
          _id: newWalletId,
          type: 'mnemonic_phrase',
          name: `Account ${newWalletId}`,
          mnemonicPhrase: this.cryptoService.encryptText(params.mnemonicPhrase, params.password),
          accounts: [{
            publicKey: keypair.publicKey(),
            privateKey: this.cryptoService.encryptText(keypair.secret(), params.password),
          }],
        };

        this.walletsStore.add(newWallet);
        break;

      default:
        throw new Error(`Can't handle wallet type`);
    }

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

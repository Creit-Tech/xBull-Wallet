import { Injectable } from '@angular/core';
import { mnemonicToSeed } from 'bip39';
import { HdWalletService } from '~root/core/accounts/services/hd-wallet.service';
import { Keypair } from 'stellar-sdk';
import { AccountsStore } from '~root/core/accounts/state';
import { CryptoService } from '~root/core/crypto/services/crypto.service';

@Injectable({
  providedIn: 'root'
})
export class AccountsService {

  constructor(
    private readonly hdWallet: HdWalletService,
    private readonly accountsStore: AccountsStore,
    private readonly cryptoService: CryptoService,
  ) { }

  async getKeypairFromMnemonicPhrase(mnemonicPhrase: string, path = `m/44'/148'/0'`): Promise<Keypair> {
    const seedBuffer = await mnemonicToSeed(mnemonicPhrase);
    const seedString = seedBuffer.toString('hex');
    const ed25519SeedObject = this.hdWallet.derivePath(`m/44'/148'/0'`, seedString);
    return Keypair.fromRawEd25519Seed(ed25519SeedObject.key);
  }

  async generateNewWallet(params: INewWalletType): Promise<string> {
    let keypair: Keypair;

    switch (params.type) {
      case 'mnemonic_phrase':
        keypair = await this.getKeypairFromMnemonicPhrase(params.mnemonicPhrase, params.path);
        break;

      default:
        throw new Error(`Can't handle wallet type`);
    }

    this.accountsStore.upsertMany([{
      publicKey: keypair.publicKey(),
      privateKey: this.cryptoService.encryptText(keypair.secret(), params.password),
    }]);

    return keypair.publicKey();
  }

  savePasswordHash(password: string): void {
    const hash = this.cryptoService.hashPassword(password);
    this.accountsStore.update(state => ({
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

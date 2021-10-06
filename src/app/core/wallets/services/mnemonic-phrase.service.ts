import { Injectable } from '@angular/core';
import { generateMnemonic, mnemonicToSeed, validateMnemonic, wordlists } from 'bip39';
import { Keypair } from 'stellar-base';
import { HdWalletService } from '~root/core/wallets/services/hd-wallet.service';

@Injectable({
  providedIn: 'root'
})
export class MnemonicPhraseService {

  constructor(
    private readonly hdWallet: HdWalletService,
  ) { }

  getWordList() {
    return [...wordlists['EN']];
  }

  generateMnemonicPhrase(): string {
    return generateMnemonic(256);
  }

  async getKeypairFromMnemonicPhrase(mnemonicPhrase: string, path = `m/44'/148'/0'`): Promise<Keypair> {
    const seedBuffer = await mnemonicToSeed(mnemonicPhrase);
    const seedString = seedBuffer.toString('hex');
    const ed25519SeedObject = this.hdWallet.derivePath(path, seedString);
    return Keypair.fromRawEd25519Seed(ed25519SeedObject.key);
  }
}

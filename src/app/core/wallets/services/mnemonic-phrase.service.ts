import { Injectable } from '@angular/core';
import { generateMnemonic, mnemonicToSeed, validateMnemonic, wordlists } from 'bip39';
import { Keypair } from '@stellar/stellar-sdk';
import { HdWalletService } from '~root/core/wallets/services/hd-wallet.service';

@Injectable({
  providedIn: 'root'
})
export class MnemonicPhraseService {

  constructor(
    private readonly hdWallet: HdWalletService,
  ) { }

  getWordList(): string[] {
    return [...wordlists.EN];
  }

  validateMnemonicPhrase(text: string): boolean {
    return validateMnemonic(text, this.getWordList());
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

  // Do not use this unless you really (and I mean REALLY) know what you are doing
  getTestAccount(): string[] {
    return [
      'bench',
      'hurt',
      'jump',
      'file',
      'august',
      'wise',
      'shallow',
      'faculty',
      'impulse',
      'spring',
      'exact',
      'slush',
      'thunder',
      'author',
      'capable',
      'act',
      'festival',
      'slice',
      'deposit',
      'sauce',
      'coconut',
      'afford',
      'frown',
      'better',
    ];
  }
}

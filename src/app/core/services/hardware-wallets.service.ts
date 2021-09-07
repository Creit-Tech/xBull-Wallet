import { Injectable } from '@angular/core';
import TransportWebUSB from '@ledgerhq/hw-transport-webusb';
import Str from '@ledgerhq/hw-app-str';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import TrezorConnect from 'trezor-connect';
import { BehaviorSubject } from 'rxjs';
import { Transaction } from 'stellar-base';
import { trezorTransformTransaction } from '~root/lib/trezor/trezor-transform-transaction';
import { filter, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class HardwareWalletsService {
  trezorInitiated$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor(
    private readonly stellarSdkService: StellarSdkService,
  ) {
    this.configureTrezorLibrary().then(() => {
      console.log('Trezor connected');
      this.trezorInitiated$.next(true);
    });
  }

  // -- Ledger Wallet

  checkIfWebUSBIsSupported(): Promise<boolean> {
    return TransportWebUSB.isSupported();
  }

  connectLedgerWallet(): Promise<TransportWebUSB> {
    return TransportWebUSB.request();
  }

  getConnectedLedgers(): Promise<USBDevice[]> {
    return TransportWebUSB.list();
  }

  openLedgerConnection(device: USBDevice): Promise<TransportWebUSB> {
    return TransportWebUSB.open(device);
  }

  async getLedgerPublicKey(path = `44'/148'/0'`, transport?: TransportWebUSB): Promise<string> {
    const finalTransport = !!transport ? transport : (await TransportWebUSB.create());
    const str = new Str(finalTransport);
    const result = await str.getPublicKey(path);
    return result.publicKey;
  }

  async signWithLedger(data: { xdr: string, accountPath: string, publicKey: string, transport: TransportWebUSB }): Promise<string> {
    const transaction = new this.stellarSdkService.SDK.Transaction(
      data.xdr,
      this.stellarSdkService.networkPassphrase,
    );
    const str = new Str(data.transport);
    const result = await str.signTransaction(data.accountPath, transaction.signatureBase());

    // add signature to transaction
    const keyPair = this.stellarSdkService.SDK.Keypair.fromPublicKey(data.publicKey);
    const hint = keyPair.signatureHint();
    const decorated = new this.stellarSdkService.SDK.xdr.DecoratedSignature({
      hint,
      signature: result.signature
    });
    transaction.signatures.push(decorated);

    return transaction.toXDR();
  }

  // -- Trezor Wallet

  async configureTrezorLibrary(): Promise<void> {
    return TrezorConnect.init({
      lazyLoad: false,
      manifest: {
        email: 'xbull@creit.tech',
        appUrl: 'https://xbull.app',
      }
    });
  }

  // This method only completes when Trezor connection is ready
  async waitUntilTrezorIsInitiated(): Promise<boolean> {
    return this.trezorInitiated$
      .pipe(filter(value => value))
      .pipe(take(1))
      .toPromise();
  }

  async getTrezorPublicKeys(range: { start: number; end: number }) {
    const bundle: Array<{ path: string; showOnTrezor: boolean }> = [];
    for (let i = range.start; i < range.end; i++) {
      bundle.push({
        path: `m/44'/148'/${i}'`,
        showOnTrezor: false
      });
    }

    return TrezorConnect.stellarGetAddress({ bundle });
  }

  async signWithTrezor(params: { path: string; transaction: Transaction; networkPassphrase: string; }): Promise<string> {
    const trezorTransaction = trezorTransformTransaction(params.path, params.transaction);

    const result = await TrezorConnect.stellarSignTransaction(trezorTransaction);

    if (!result.success) {
      throw new Error(result.payload.error);
    }

    const signature = Buffer.from(result.payload.signature, 'hex');
    const publicKeyBytes = Buffer.from(result.payload.publicKey, 'hex');

    const encodedPublicKey = this.stellarSdkService.SDK.StrKey.encodeEd25519PublicKey(publicKeyBytes);

    const keyPair = this.stellarSdkService.SDK.Keypair.fromPublicKey(encodedPublicKey);
    const hint = keyPair.signatureHint();
    const decorated = new this.stellarSdkService.SDK.xdr.DecoratedSignature({
      hint,
      signature
    });

    params.transaction.signatures.push(decorated);

    return params.transaction.toXDR();
  }
}

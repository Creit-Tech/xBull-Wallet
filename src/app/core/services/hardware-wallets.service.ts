import { Injectable } from '@angular/core';
import TransportWebUSB from '@ledgerhq/hw-transport-webusb';
import Str from '@ledgerhq/hw-app-str';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import TrezorConnect, { BundledResponse, StellarAddress } from 'trezor-connect';
import { BehaviorSubject } from 'rxjs';
import { Transaction } from 'stellar-base';
import * as SorobanClient from 'soroban-client';
// @ts-ignore
import transformTransaction from 'trezor-connect/lib/plugins/stellar/plugin';
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

  async signWithLedger(data: {
    accountPath: string,
    publicKey: string,
    transaction: Transaction | SorobanClient.Transaction,
    transport: TransportWebUSB,
  }): Promise<IHWSigningResult> {
    const str = new Str(data.transport);

    // I know that the ledger can get a signatureBase with 1540 length
    // But I have received issues even with ~1400 long signatures, so we use a hash method if 1000 is reached
    const result = data.transaction.signatureBase().length < 1000
      ? await str.signTransaction(data.accountPath, data.transaction.signatureBase())
      : await str.signHash(data.accountPath, data.transaction.hash());

    return {
      publicKey: data.publicKey,
      signature: result.signature.toString('base64')
    };
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

  async getTrezorPublicKeys(range: { start: number; end: number }): Promise<BundledResponse<StellarAddress>> {
    const bundle: Array<{ path: string; showOnTrezor: boolean }> = [];
    for (let i = range.start; i < range.end; i++) {
      bundle.push({
        path: `m/44'/148'/${i}'`,
        showOnTrezor: false
      });
    }

    return TrezorConnect.stellarGetAddress({ bundle });
  }

  async signWithTrezor(params: {
    path: string;
    transaction: Transaction | SorobanClient.Transaction;
    networkPassphrase: string;
  }): Promise<IHWSigningResult> {
    const trezorTransaction = transformTransaction(params.path, params.transaction);

    const result = await TrezorConnect.stellarSignTransaction(trezorTransaction);

    if (!result.success) {
      throw new Error(result.payload.error);
    }

    return {
      publicKey: result.payload.publicKey,
      signature: result.payload.signature,
    };
  }
}

export interface IHWSigningResult {
  publicKey: string;
  signature: string;
}

import { Injectable } from '@angular/core';
import TransportWebUSB from '@ledgerhq/hw-transport-webusb';
import Str from '@ledgerhq/hw-app-str';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';

@Injectable({
  providedIn: 'root'
})
export class HardwareWalletsService {

  constructor(
    private readonly stellarSdk: StellarSdkService,
  ) { }

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
    const transaction = new this.stellarSdk.SDK.Transaction(
      data.xdr,
      this.stellarSdk.networkPassphrase,
    );
    const str = new Str(data.transport);
    const result = await str.signTransaction(data.accountPath, transaction.signatureBase());

    // add signature to transaction
    const keyPair = this.stellarSdk.SDK.Keypair.fromPublicKey(data.publicKey);
    const hint = keyPair.signatureHint();
    const decorated = new this.stellarSdk.SDK.xdr.DecoratedSignature({
      hint,
      signature: result.signature
    });
    transaction.signatures.push(decorated);

    return transaction.toXDR();
  }
}

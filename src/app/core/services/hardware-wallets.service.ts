import { Injectable } from '@angular/core';
import TransportWebUSB from '@ledgerhq/hw-transport-webusb';
import Transport from '@ledgerhq/hw-transport';
import Str from '@ledgerhq/hw-app-str';

@Injectable({
  providedIn: 'root'
})
export class HardwareWalletsService {

  constructor() { }

  checkIfWebUSBIsSupported(): Promise<boolean> {
    return TransportWebUSB.isSupported();
  }

  connectLedgerWallet(): Promise<Transport> {
    return TransportWebUSB.request();
  }

  async getLedgerPublicKey(path = `44'/148'/0'`, transport?: Transport): Promise<string> {
    const finalTransport = !!transport ? transport : (await TransportWebUSB.create());
    const str = new Str(finalTransport);
    const result = await str.getPublicKey(path);
    return result.publicKey;
  }
}

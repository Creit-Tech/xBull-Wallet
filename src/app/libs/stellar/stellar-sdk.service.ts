import { Injectable } from '@angular/core';
import { Keypair, Transaction, Server, Networks } from 'stellar-sdk';

@Injectable({
  providedIn: 'root'
})
export class StellarSdkService {
  // TODO: Make this optional before launching the app IE add a settings store
  get Server(): Server {
    return new Server('https://horizon-testnet.stellar.org');
  }

  // TODO: Make this optional before launching the app IE add a settings store
  get networkPassphrase(): string {
    return Networks.TESTNET;
  }

  // TODO: Make this optional before launching the app IE add a settings store
  get fee(): string {
    return '100';
  }

  // TODO: Make this optional before launching the app IE add a settings store
  get defaultTimeout(): number {
    return 60;
  }

  constructor() { }

  signTransaction(data: { xdr: string, secret: string }): string {
    const keypair = Keypair.fromSecret(data.secret);
    const transaction = new Transaction(
      data.xdr,
      this.networkPassphrase
    );
    transaction.sign(keypair);

    return transaction.toXDR();
  }

  submitTransaction(xdr: string) {
    const transaction = new Transaction(
      xdr,
      this.networkPassphrase
    );

    return this.Server.submitTransaction(transaction);
  }


}

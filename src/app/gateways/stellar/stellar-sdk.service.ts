import { Injectable } from '@angular/core';
import { Keypair, Transaction, Server, Networks, ServerApi, Horizon } from 'stellar-sdk';
import BigNumber from 'bignumber.js';
import { SettingsQuery } from '~root/state';

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
    const { defaultFee } = this.settingsQuery.getValue();
    return defaultFee;
  }

  fee$: Observable<string> = this.settingsQuery.defaultFee$;

  // TODO: Make this optional before launching the app IE add a settings store
  get defaultTimeout(): number {
    return 60;
  }

  constructor(
    private readonly settingsQuery: SettingsQuery,
  ) { }

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

  calculateAvailableBalance(account: ServerApi.AccountRecord, code: 'native' | string): BigNumber {
    let balanceLine: Horizon.BalanceLine;
    let finalAmount = new BigNumber(0);

    if (code === 'XLM') {
      const minimumBase = new BigNumber(2)
        .plus(account.subentry_count)
        .plus(account.num_sponsoring)
        .minus(account.num_sponsored)
        .multipliedBy(0.5);

      finalAmount = finalAmount.minus(minimumBase);
    }

    balanceLine = code === 'XLM'
      ? account.balances
        .find(balance => balance.asset_type === 'native') as Horizon.BalanceLineNative
      : account.balances
        .find(balance => balance.asset_type !== 'native' && balance.asset_code === code) as Horizon.BalanceLineAsset;

    finalAmount = finalAmount.plus(new BigNumber(balanceLine.balance))
      .minus(new BigNumber(balanceLine.selling_liabilities));

    return finalAmount.isLessThanOrEqualTo(0) ? new BigNumber(0) : finalAmount;
  }


}

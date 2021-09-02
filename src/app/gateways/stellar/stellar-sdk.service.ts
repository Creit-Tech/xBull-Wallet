import { Injectable } from '@angular/core';
import * as SDK from 'stellar-sdk';
import BigNumber from 'bignumber.js';
import { HorizonApisQuery, IHorizonApi, SettingsQuery } from '~root/state';

@Injectable({
  providedIn: 'root'
})
export class StellarSdkService {
  SDK: typeof SDK = SDK;

  get Server(): SDK.Server {
    const activeValue = this.horizonApisQuery.getActive() as IHorizonApi;
    return new this.SDK.Server(activeValue.url);
  }

  get networkPassphrase(): string {
    const activeValue = this.horizonApisQuery.getActive() as IHorizonApi;
    return activeValue.networkPassphrase;
  }

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
    private readonly horizonApisQuery: HorizonApisQuery,
  ) { }

  signTransaction(data: { xdr: string, secret: string }): string {
    const keypair = this.SDK.Keypair.fromSecret(data.secret);
    const transaction = new this.SDK.Transaction(
      data.xdr,
      this.networkPassphrase
    );
    transaction.sign(keypair);

    return transaction.toXDR();
  }

  submitTransaction(xdr: string) {
    const transaction = new this.SDK.Transaction(
      xdr,
      this.networkPassphrase
    );

    return this.Server.submitTransaction(transaction);
  }

  calculateAvailableBalance(account: SDK.ServerApi.AccountRecord, code: 'native' | string): BigNumber {
    let balanceLine: SDK.Horizon.BalanceLine;
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
        .find(balance => balance.asset_type === 'native') as SDK.Horizon.BalanceLineNative
      : account.balances
        .find(balance => balance.asset_type !== 'native' && balance.asset_code === code) as SDK.Horizon.BalanceLineAsset;

    finalAmount = finalAmount.plus(new BigNumber(balanceLine.balance))
      .minus(new BigNumber(balanceLine.selling_liabilities));

    return finalAmount.isLessThanOrEqualTo(0) ? new BigNumber(0) : finalAmount;
  }


}

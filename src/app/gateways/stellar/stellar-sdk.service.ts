import { Injectable } from '@angular/core';
import * as SDK from 'stellar-sdk';
import BigNumber from 'bignumber.js';
import {BalanceAssetType, HorizonApisQuery, IHorizonApi, SettingsQuery} from '~root/state';

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

  submitTransaction(xdr: string): Promise<SDK.Horizon.SubmitTransactionResponse> {
    const transaction = new this.SDK.Transaction(
      xdr,
      this.networkPassphrase
    );

    return this.Server.submitTransaction(transaction);
  }

  calculateAvailableBalance(data: {
    balanceLine: SDK.Horizon.BalanceLine;
    account: SDK.ServerApi.AccountRecord
  }): BigNumber {
    let finalAmount = new BigNumber(0);

    if (data.balanceLine.asset_type === 'native') {
      const minimumBase = new BigNumber(2)
        .plus(data.account.subentry_count)
        .plus(data.account.num_sponsoring)
        .minus(data.account.num_sponsored)
        .multipliedBy(0.5);

      finalAmount = finalAmount.minus(minimumBase);
    }

    switch (data.balanceLine.asset_type) {
      case 'native':
      case 'credit_alphanum4':
      case 'credit_alphanum12':
        finalAmount = finalAmount.plus(new BigNumber(data.balanceLine.balance))
          .minus(new BigNumber(data.balanceLine.selling_liabilities));
        break;

      case 'liquidity_pool_shares':
        finalAmount = finalAmount.plus(new BigNumber(data.balanceLine.balance));
        break;
    }

    return finalAmount.isLessThanOrEqualTo(0) ? new BigNumber(0) : finalAmount;
  }


}

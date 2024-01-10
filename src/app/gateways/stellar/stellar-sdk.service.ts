import { Injectable } from '@angular/core';
import BigNumber from 'bignumber.js';
import { HorizonApisQuery, IHorizonApi, SettingsQuery, SettingsStore } from '~root/state';
import { from, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import * as SDK from 'stellar-sdk';

@Injectable({
  providedIn: 'root'
})
export class StellarSdkService {
  // TODO: Think a better way of doing this
  private stellarOperations: Array<string> = [
    'createAccount',
    'payment',
    'pathPaymentStrictReceive',
    'pathPaymentStrictSend',
    'createPassiveSellOffer',
    'manageSellOffer',
    'manageBuyOffer',
    'setOptions',
    'changeTrust',
    'allowTrust',
    'accountMerge',
    'inflation',
    'manageData',
    'bumpSequence',
    'createClaimableBalance',
    'claimClaimableBalance',
    'beginSponsoringFutureReserves',
    'endSponsoringFutureReserves',
    'revokeAccountSponsorship',
    'revokeTrustlineSponsorship',
    'revokeOfferSponsorship',
    'revokeDataSponsorship',
    'revokeClaimableBalanceSponsorship',
    'revokeLiquidityPoolSponsorship',
    'revokeSignerSponsorship',
    'clawback',
    'clawbackClaimableBalance',
    'setTrustLineFlags',
    'liquidityPoolDeposit',
    'liquidityPoolWithdraw',
    'invokeHostFunction',
    'restoreFootprint',
    'bumpFootprintExpiration'
  ];

  SDK: typeof SDK = SDK;

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
    return 180;
  }

  constructor(
    private readonly settingsQuery: SettingsQuery,
    private readonly horizonApisQuery: HorizonApisQuery,
    private readonly settingsStore: SettingsStore,
  ) { }

  // tslint:disable-next-line:typedef
  keypairFromSecret(params: { transaction: SDK.Transaction, secret: string }) {
    return this.SDK.Keypair.fromSecret(params.secret);
  }

  selectServer(url?: string, options?: SDK.Horizon.Server.Options): SDK.Horizon.Server {
    const activeValue = this.horizonApisQuery.getActive() as IHorizonApi;
    return new this.SDK.Horizon.Server(
      url || activeValue.url,
      options || { allowHttp: url?.includes('http://localhost') }
    );
  }

  submit(transaction: SDK.Transaction): Promise<SDK.Horizon.HorizonApi.SubmitTransactionResponse> {
      return this.selectServer().submitTransaction(transaction);
  }

  // TODO: once soroban client is here to stay, refactor all the SDK logic
  createTransaction(params: { xdr: string; networkPassphrase?: string; }): SDK.Transaction {
    return new this.SDK.Transaction(params.xdr, params.networkPassphrase || this.networkPassphrase);
  }

  loadAccount(account: string): Promise<SDK.Horizon.AccountResponse> {
    if (this.SDK.StrKey.isValidMed25519PublicKey(account)) {
      const muxedAccount = this.SDK.MuxedAccount.fromAddress(account, '-1');
      return this.selectServer().loadAccount(muxedAccount.baseAccount().accountId());
    } else {
      return this.selectServer().loadAccount(account);
    }
  }

  /**
   * @deprecated
   */
  signTransaction(data: { xdr: string, secret: string, passphrase: string; }): string {
    const transaction = this.createTransaction({ xdr: data.xdr, networkPassphrase: data.passphrase });
    const keypair = this.keypairFromSecret({ transaction, secret: data.secret });
    // TODO: Once we merge soroban and stellar sdk, we should rethink this "as any"
    transaction.sign(keypair as any);
    return transaction.toXDR();
  }

  /**
   * @Deprecated
   */
  submitTransaction(xdr: string): Promise<SDK.Horizon.HorizonApi.SubmitTransactionResponse> {
    const transaction = new this.SDK.Transaction(
      xdr,
      this.networkPassphrase
    );

    return this.selectServer().submitTransaction(transaction);
  }

  calculateAvailableBalance(data: {
    balanceLine: SDK.Horizon.HorizonApi.BalanceLine;
    account: SDK.Horizon.ServerApi.AccountRecord
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

  getRecommendedFee(): Observable<string> {
    const promise = this.selectServer().ledgers()
      .order('desc')
      .limit(1)
      .call();

    return from(promise)
      .pipe(map((value) => {
        return value.records[0];
      }))
      .pipe(switchMap(ledger => {
        return this.selectServer().transactions()
          .forLedger(ledger.sequence)
          .call();
      }))
      .pipe(map(({ records }) => {
        // @ts-ignore
        const fees = records.map(record => new BigNumber(record.max_fee));

        const arrSort = fees.sort((a, b) => {
          return a.toNumber() - b.toNumber();
        });

        const mid = Math.ceil(fees.length / 2);

        return fees.length % 2 === 0
          ? arrSort[mid].plus(arrSort[mid - 1]).dividedBy(2)
          : arrSort[mid - 1];
      }))
      .pipe(map(value => value.toFixed(0)));
  }

  assetToCanonicalString(asset: SDK.Asset): string {
    if (asset.isNative()) {
      return 'native';
    } else {
      return asset.code + ':' + asset.issuer;
    }
  }

  checkIfAllOperationsAreHandled(operations: SDK.Operation[]): true {
    for (const operation of operations) {
      if (this.stellarOperations.indexOf(operation.type) === -1) {
        throw new Error(`Operation type "${operation.type}" is not handled by this wallet yet.`);
      }
    }

    return true;
  }

}

import { Injectable } from '@angular/core';
import BigNumber from 'bignumber.js';
import { HorizonApisQuery, INetworkApi, SettingsQuery, SettingsStore } from '~root/state';
import { from, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import * as SDK from '@stellar/stellar-sdk';
import { NzMessageService } from 'ng-zorro-antd/message';

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
    'bumpFootprintExpiration',
    'extendFootprintTtl'
  ];

  SDK: typeof SDK = SDK;

  get networkPassphrase(): string {
    const activeValue = this.horizonApisQuery.getActive() as INetworkApi;
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
    private readonly nzMessageService: NzMessageService,
  ) { }

  // tslint:disable-next-line:typedef
  keypairFromSecret(params: { secret: string }) {
    return this.SDK.Keypair.fromSecret(params.secret);
  }

  selectServer(url?: string, options?: SDK.Horizon.Server.Options): SDK.Horizon.Server {
    const activeValue = this.horizonApisQuery.getActive() as INetworkApi;
    return new this.SDK.Horizon.Server(
      url || activeValue.url,
      options || { allowHttp: url?.includes('http://localhost') }
    );
  }

  selectRPC(url?: string, options?: SDK.SorobanRpc.Server.Options): SDK.SorobanRpc.Server {
    const activeValue = this.horizonApisQuery.getActive() as INetworkApi;

    if (!activeValue.rpcUrl) {
      throw new Error(`${activeValue.name} doesn't have an RPC defined. Define one in the settings.`);
    }

    return new this.SDK.SorobanRpc.Server(
      url || activeValue.rpcUrl,
      options || { allowHttp: url?.includes('http://localhost') }
    );
  }

  async submit(transaction: SDK.Transaction | SDK.FeeBumpTransaction): Promise<void> {
    if (transaction instanceof SDK.FeeBumpTransaction) {
      await this.selectServer().submitTransaction(transaction);
    } else if (!!transaction.operations.find(op => op.type === 'invokeHostFunction')) {
      const rpc = this.selectRPC();
      const result = await rpc.sendTransaction(transaction);
      if (result.status === 'ERROR') {
        throw new Error('Error while sending the transaction ' + result.hash);
      }

      await this.waitUntilTxApproved(rpc, result.hash);
      await rpc.getTransaction(result.hash);
    } else {
      await this.selectServer().submitTransaction(transaction);
    }
  }

  async waitUntilTxApproved(rpc: SDK.SorobanRpc.Server, hash: string, times = 60) {
    let completed = false;
    let attempts = 0;
    while (!completed) {
      const tx = await rpc.getTransaction(hash);

      if (tx.status === 'NOT_FOUND') {
        await new Promise(r => setTimeout(r, 1000));
      } else if (tx.status === 'SUCCESS') {
        completed = true;
      } else {
        throw new Error(`Transaction ${hash} failed.`);
      }

      attempts++;

      if (attempts >= times) {
        throw new Error(`The network did not accept the tx ${hash} in less than ${times} seconds.`);
      }
    }
  }

  // TODO: once soroban client is here to stay, refactor all the SDK logic
  createTransaction(params: { xdr: string; networkPassphrase?: string; }): SDK.Transaction | SDK.FeeBumpTransaction {
    try {
      return new this.SDK.FeeBumpTransaction(params.xdr, params.networkPassphrase || this.networkPassphrase);
    } catch (e) {
      // console.error(e);
    }

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

  async simOrRestore(tx: SDK.Transaction, opts?: { rpc: SDK.SorobanRpc.Server }): Promise<SDK.Transaction> {
    const rpc = opts?.rpc || this.selectRPC();
    const sim = await rpc.simulateTransaction(tx);

    if (this.SDK.SorobanRpc.Api.isSimulationError(sim)) {
      console.error(sim.error);
      throw new Error('Contract call simulation failed.');
    }

    if (!this.SDK.SorobanRpc.Api.isSimulationRestore(sim)) {
      return this.SDK.SorobanRpc.assembleTransaction(tx, sim).build();
    }

    this.nzMessageService.info('You need to restore a ledger key first', { nzDuration: 3000 });

    const account: SDK.Account = await rpc.getAccount(tx.source);
    let fee: number = parseInt(tx.fee);
    fee += parseInt(sim.restorePreamble.minResourceFee);

    return new this.SDK.TransactionBuilder(account, { fee: fee.toString() })
      .setNetworkPassphrase(tx.networkPassphrase)
      .setSorobanData(sim.restorePreamble.transactionData.build())
      .addOperation(this.SDK.Operation.restoreFootprint({}))
      .setTimeout(0)
      .build();
  }

  /**
   * @deprecated
   */
  signTransaction(data: { xdr: string, secret: string, passphrase: string; }): string {
    const transaction = this.createTransaction({ xdr: data.xdr, networkPassphrase: data.passphrase });
    const keypair = this.keypairFromSecret({ secret: data.secret });
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

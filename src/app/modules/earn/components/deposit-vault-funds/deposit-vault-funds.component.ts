import { Component, Input, OnInit } from '@angular/core';
import { IEarnStrategy } from '~root/modules/earn/state/strategies/earn-strategy.model';
import { BehaviorSubject, combineLatest, Observable, ReplaySubject } from 'rxjs';
import { FormControl, Validators } from '@angular/forms';
import { WalletsAccountsQuery } from '~root/state';
import { map, take } from 'rxjs/operators';
import { Horizon } from 'stellar-sdk';
import BalanceLineAsset = Horizon.BalanceLineAsset;
import { NzMessageService } from 'ng-zorro-antd/message';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import BigNumber from 'bignumber.js';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import { XdrSignerComponent } from '~root/shared/modals/components/xdr-signer/xdr-signer.component';

@Component({
  selector: 'app-deposit-vault-funds',
  templateUrl: './deposit-vault-funds.component.html',
  styleUrls: ['./deposit-vault-funds.component.scss']
})
export class DepositVaultFundsComponent implements OnInit {
  depositingFunds$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  strategy$: ReplaySubject<IEarnStrategy> = new ReplaySubject<IEarnStrategy>();
  @Input() set strategy(data: IEarnStrategy) {
    this.strategy$.next(data);
  }

  depositAmountControl: FormControl = new FormControl(0, [
    Validators.required,
    Validators.min(1),
  ]);

  selectedAccount$ = this.walletsAccountsQuery.getSelectedAccount$;

  acceptedAssetBalance$: Observable<BalanceLineAsset | undefined> = combineLatest([
    this.selectedAccount$,
    this.strategy$,
  ])
    .pipe(map(([selectedAccount, strategy]) => {
      if (!selectedAccount || !strategy) {
        return undefined;
      }

      return selectedAccount.accountRecord?.balances.find((b) => {
        return (
          (b.asset_type === 'credit_alphanum4' || b.asset_type === 'credit_alphanum12')
          && b.asset_code === strategy.assetCodeAccepted
          && b.asset_issuer === strategy.assetIssuerAccepted
        );
      }) as BalanceLineAsset | undefined;
    }));

  constructor(
    private readonly stellarSdkService: StellarSdkService,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly nzMessageService: NzMessageService,
    private readonly nzDrawerService: NzDrawerService,
  ) {}

  ngOnInit(): void {
  }

  setMaxValue(): void {
    this.acceptedAssetBalance$
      .pipe(take(1))
      .subscribe(data => {
        this.depositAmountControl.setValue(data?.balance || 0);
      });
  }

  async confirm(): Promise<void> {
    const [
      strategy,
      acceptedAssetBalance,
      selectedAccount
    ] = await Promise.all([
      this.strategy$.pipe(take(1)).toPromise(),
      this.acceptedAssetBalance$.pipe(take(1)).toPromise(),
      this.selectedAccount$.pipe(take(1)).toPromise()
    ]);

    if (
      !acceptedAssetBalance
      || !selectedAccount
      || !selectedAccount.accountRecord
      || !strategy
    ) { return; }

    const account = new this.stellarSdkService.SDK.Account(
      selectedAccount.accountRecord.account_id,
      selectedAccount.accountRecord.sequence
    );

    const transactionBuilder = new this.stellarSdkService.SDK.TransactionBuilder(account, {
      fee: this.stellarSdkService.fee,
      networkPassphrase: this.stellarSdkService.networkPassphrase,
    }).setTimeout(this.stellarSdkService.defaultTimeout)
      .addOperation(
        this.stellarSdkService.SDK.Operation.createClaimableBalance({
          asset: new this.stellarSdkService.SDK.Asset(acceptedAssetBalance.asset_code, acceptedAssetBalance.asset_issuer),
          amount: new BigNumber(this.depositAmountControl.value).toFixed(7),
          claimants: [
            new this.stellarSdkService.SDK.Claimant(account.accountId()),
            new this.stellarSdkService.SDK.Claimant(strategy.contractAccount),
          ]
        })
      );

    const hasTrustline = !!selectedAccount.accountRecord.balances.find(b => {
      return (
        (b.asset_type === 'credit_alphanum4' || b.asset_type === 'credit_alphanum12')
        && b.asset_type === strategy.pointerAssetCode
        && b.asset_issuer === strategy.contractAccount
      );
    });
    if (!hasTrustline) {
      transactionBuilder.addOperation(
        this.stellarSdkService.SDK.Operation.changeTrust({
          asset: new this.stellarSdkService.SDK.Asset(strategy.pointerAssetCode, strategy.contractAccount),
        })
      );
    }

    const transaction = transactionBuilder.build();

    this.nzDrawerService.create<XdrSignerComponent>({
      nzContent: XdrSignerComponent,
      nzTitle: 'Sign transaction',
      nzWrapClassName: 'drawer-full-w-320 ios-safe-y',
      nzContentParams: {
        xdr: transaction.toXDR(),
        acceptHandler: result => {
          this.depositingFunds$.next(true);
          const messageId = this.nzMessageService.loading('Sending to the network...', {
            nzDuration: 0,
          }).messageId;
          this.stellarSdkService.submitTransaction(result)
            .then(_ => {
              this.depositingFunds$.next(false);
              this.depositAmountControl.reset();
              this.nzMessageService.remove(messageId);
              this.nzMessageService.success(
                'Deposit request completed! You will receive your shares once the deposit is accepted',
                { nzDuration: 5000 }
              );
            })
            .catch(_ => {
              this.depositingFunds$.next(false);
              this.nzMessageService.remove(messageId);
              this.nzMessageService.error('The network rejected the transaction');
            });
        }
      }
    });


  }

}

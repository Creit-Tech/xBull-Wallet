import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { distinctUntilChanged, distinctUntilKeyChanged, map, switchMap, take, takeUntil } from 'rxjs/operators';
import {
  AnchorsService, IAnchorCurrency, IAnchorDepositTransaction, IAnchorTransaction, IAnchorWithdrawTransaction,
  IGetAnchorTransactionsResponse, IStartInteractiveResponse,
} from '~root/modules/anchors/services/anchors.service';
import { BehaviorSubject, combineLatest, Observable, ReplaySubject, Subject, Subscription, timer } from 'rxjs';
import { IAnchor } from '~root/modules/anchors/state/anchor.model';
import { IWalletsAccount } from '~root/state';
import { NzMessageService } from 'ng-zorro-antd/message';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import { Memo } from 'stellar-sdk';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import { XdrSignerComponent } from '~root/shared/shared-modals/components/xdr-signer/xdr-signer.component';
import { TranslateService } from '@ngx-translate/core';
import { FormControl } from '@angular/forms';
import BigNumber from 'bignumber.js';

@Component({
  selector: 'app-anchored-asset-interaction-drawer',
  templateUrl: './anchored-asset-interaction-drawer.component.html',
  styleUrls: ['./anchored-asset-interaction-drawer.component.scss']
})
export class AnchoredAssetInteractionDrawerComponent implements OnInit, OnDestroy {
  componentDestroyed$ = new Subject();
  anchor$: ReplaySubject<IAnchor> = new ReplaySubject<IAnchor>();
  set anchor(data: IAnchor) {
    this.anchor$.next(data);
  }

  anchorAuthTokenString$: ReplaySubject<string> = new ReplaySubject<string>();
  set anchorAuthTokenString(data: string) {
    this.anchorAuthTokenString$.next(data);
  }

  walletAccount$: ReplaySubject<IWalletsAccount> = new ReplaySubject<IWalletsAccount>();
  set walletAccount(data: IWalletsAccount) {
    this.walletAccount$.next(data);
  }

  anchorCurrency$: ReplaySubject<IAnchorCurrency> = new ReplaySubject<IAnchorCurrency>();
  set anchorCurrency(data: IAnchorCurrency) {
    this.anchorCurrency$.next(data);
  }

  transactions$: BehaviorSubject<IGetAnchorTransactionsResponse['transactions']> =
    new BehaviorSubject<IGetAnchorTransactionsResponse['transactions']>([]);

  gettingTransactions$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);

  showEmpty$: Observable<boolean> = combineLatest([
    this.gettingTransactions$,
    this.transactions$,
  ])
    .pipe(map(([gettingTransactions, transactions]) => {
      return !gettingTransactions && transactions.length === 0;
    }));

  loadingDeposit = false;
  loadingWithdraw = false;

  openedWindow?: Window | null;

  currentWithdrawId$: ReplaySubject<string> = new ReplaySubject<string>();

  amountControl: FormControl<number | null> = new FormControl<number | null>(0);

  constructor(
    private readonly anchorsService: AnchorsService,
    private readonly nzMessageService: NzMessageService,
    private readonly stellarSdkService: StellarSdkService,
    private readonly nzDrawerService: NzDrawerService,
    private readonly translateService: TranslateService,
  ) { }

  getTransactionsSubscription = combineLatest([
    this.anchor$.pipe(distinctUntilKeyChanged('_id')),
    this.anchorAuthTokenString$.pipe(distinctUntilChanged()),
    this.walletAccount$.pipe(distinctUntilKeyChanged('_id'))
  ])
    .pipe(switchMap(values => {
      return timer(0, 2000)
        .pipe(takeUntil(this.componentDestroyed$))
        .pipe(map(_ => ({
          anchor: values[0],
          authTokenString: values[1],
          walletAccount: values[2],
        })));
    }))
    .pipe(takeUntil(this.componentDestroyed$))
    .subscribe((values) => {
      this.getAnchorTransactions(values)
        .then(() => this.gettingTransactions$.next(false))
        .catch(() => this.gettingTransactions$.next(false));
    });

  generateTransactionForCurrentWithdrawSubscription: Subscription = combineLatest([
    this.transactions$.asObservable(),
    this.currentWithdrawId$.asObservable(),
  ])
    .pipe(map(([transactions, currentWithdrawId]) => transactions.find(t => t.id === currentWithdrawId)))
    .pipe(takeUntil(this.componentDestroyed$))
    .subscribe(transaction => {
      if (
        transaction?.status === 'pending_user_transfer_start' &&
        !!(transaction as IAnchorWithdrawTransaction)?.withdraw_anchor_account
      ) {
        this.generateWithdrawTransaction(transaction as IAnchorWithdrawTransaction)
          .then();
      }
    });

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  async getAnchorTransactions(params: { anchor: IAnchor, authTokenString: string; walletAccount: IWalletsAccount }): Promise<void> {
    const anchorCurrency = await this.anchorCurrency$.pipe(take(1)).toPromise();

    if (!params.walletAccount || !anchorCurrency) {
      return;
    }

    let authToken: string | undefined = params.authTokenString;
    if (!authToken) {
      try {
        authToken = await this.anchorsService.authenticateWithAnchor(
          params.anchor,
          params.walletAccount.publicKey
        );
      } catch (e) {
        console.error(e);
        this.nzMessageService.error('Authentication with the anchor failed');
        this.loadingDeposit = false;
        return;
      }
    }

    this.anchorsService.getAnchorTransactions({
      token: authToken,
      assetCode: anchorCurrency.code,
      url: params.anchor.transferServerSep24,
    })
      .subscribe(response => {
        const currentValue = this.transactions$.getValue();

        if (
          JSON.stringify(currentValue) !== JSON.stringify(response.transactions)
        ) {
          this.transactions$.next(response.transactions);
        }
      });
  }

  showTransactionMoreInfo(tx: IAnchorDepositTransaction | IAnchorWithdrawTransaction): void {
    if (tx.kind === 'withdrawal') {
      this.currentWithdrawId$.next(tx.id);
    }
    window.open(
      tx.more_info_url,
      tx.id,
      'width=380,height=640,left=100,top=100,rel=noopener'
    );
  }

  async onDeposit(currency: IAnchorCurrency): Promise<any> {
    this.loadingDeposit = true;
    const anchor = await this.anchor$.pipe(take(1)).toPromise();
    const anchorAuthTokenString = await this.anchorAuthTokenString$.pipe(take(1)).toPromise();
    const selectedAccount = await this.walletAccount$.pipe(take(1)).toPromise();

    if (!anchor || !selectedAccount) {
      this.loadingDeposit = false;
      return;
    }

    const hasTrustLine = selectedAccount.accountRecord?.balances.find(b => {
      switch (b.asset_type) {
        case 'credit_alphanum12':
        case 'credit_alphanum4':
          return b.asset_code === currency.code &&
            b.asset_issuer === currency.issuer;

        case 'native':
          return currency.code === 'XLM' && !currency.issuer;

        default:
          return false;
      }
    });

    if (!hasTrustLine) {
      this.loadingDeposit = false;
      this.nzMessageService.error(`You can only deposit assets you already trust`);
      return;
    }

    if (new BigNumber(this.amountControl.value || 0).isLessThan(currency.deposit.minAmount || 0)) {
      this.loadingDeposit = false;
      this.nzMessageService.error(`Min amount to deposit is: ${currency.deposit.minAmount}`);
      return;
    } else if (new BigNumber(this.amountControl.value || 0).isGreaterThan(currency.deposit.maxAmount || 0)) {
      this.loadingDeposit = false;
      this.nzMessageService.error(`Max amount to deposit is: ${currency.deposit.maxAmount}`);
      return;
    }

    let authToken: string | undefined = anchorAuthTokenString;
    if (!authToken) {
      try {
        authToken = await this.anchorsService.authenticateWithAnchor(
          anchor,
          selectedAccount.publicKey
        );
      } catch (e) {
        console.error(e);
        this.nzMessageService.error('Authentication with the anchor failed');
        this.loadingDeposit = false;
        return;
      }
    }

    let interactiveDepositResponse: IStartInteractiveResponse;
    try {
      interactiveDepositResponse = await this.anchorsService.startInteractiveDeposit({
        token: authToken,
        amount: this.amountControl.value || 0,
        assetCode: currency.code,
        assetIssuer: currency.issuer,
        url: anchor.transferServerSep24,
        account: selectedAccount.publicKey,
      }).pipe(take(1)).toPromise();
    } catch (e) {
      this.nzMessageService.error('Anchor rejected the transaction');
      this.loadingDeposit = false;
      return;
    }

    this.amountControl.setValue(0);
    this.loadingDeposit = false;

    window.open(
      interactiveDepositResponse.url,
      interactiveDepositResponse.id,
      'width=380,height=640,left=100,top=100,rel=noopener'
    );
  }

  async onWithdraw(currency: IAnchorCurrency): Promise<any> {
    this.loadingWithdraw = true;
    const anchor = await this.anchor$.pipe(take(1)).toPromise();
    const anchorAuthTokenString = await this.anchorAuthTokenString$.pipe(take(1)).toPromise();
    const selectedAccount = await this.walletAccount$.pipe(take(1)).toPromise();

    if (!anchor || !selectedAccount) {
      this.loadingWithdraw = false;
      return;
    }

    if (new BigNumber(this.amountControl.value || 0).isLessThan(currency.withdraw.minAmount || 0)) {
      this.loadingWithdraw = false;
      this.nzMessageService.error(`Min amount to withdraw is: ${currency.withdraw.minAmount}`);
      return;
    } else if (new BigNumber(this.amountControl.value || 0).isGreaterThan(currency.withdraw.maxAmount || 0)) {
      this.loadingWithdraw = false;
      this.nzMessageService.error(`Max amount to withdraw is: ${currency.withdraw.maxAmount}`);
      return;
    }

    let authToken: string | undefined = anchorAuthTokenString;
    if (!authToken) {
      try {
        authToken = await this.anchorsService.authenticateWithAnchor(
          anchor,
          selectedAccount.publicKey
        );
      } catch (e) {
        console.error(e);
        this.nzMessageService.error('Authentication with the anchor failed');
        this.loadingWithdraw = false;
        return;
      }
    }

    let interactiveWithdrawResponse: IStartInteractiveResponse;
    try {
      interactiveWithdrawResponse = await this.anchorsService.startInteractiveWithdraw({
        token: authToken,
        amount: this.amountControl.value || 0,
        assetCode: currency.code,
        assetIssuer: currency.issuer,
        url: anchor.transferServerSep24,
        account: selectedAccount.publicKey,
      }).pipe(take(1)).toPromise();
    } catch (e) {
      this.nzMessageService.error('Anchor rejected the transaction');
      this.loadingWithdraw = false;
      return;
    }

    this.amountControl.setValue(0);
    this.loadingWithdraw = false;
    this.currentWithdrawId$.next(interactiveWithdrawResponse.id);

    this.openedWindow = window.open(
      interactiveWithdrawResponse.url,
      interactiveWithdrawResponse.id,
      'width=380,height=640,left=100,top=100,rel=noopener'
    );
  }

  async generateWithdrawTransaction(transaction: IAnchorWithdrawTransaction): Promise<void> {
    const selectedAccount = await this.walletAccount$.pipe(take(1)).toPromise();
    const anchorCurrency = await this.anchorCurrency$.pipe(take(1)).toPromise();

    if (!selectedAccount || !anchorCurrency) {
      return;
    }

    if (!!this.openedWindow) {
      this.openedWindow.close();
    }

    this.currentWithdrawId$.next(undefined);

    const loadedAccount = await this.stellarSdkService.loadAccount(selectedAccount.publicKey);

    let memo: Memo | undefined;
    if (transaction.withdraw_memo_type === 'hash') {
      memo = Memo.hash(
        Buffer.from(
          transaction.withdraw_memo,
          'base64'
        ).toString('hex')
      );
    } else if (transaction.withdraw_memo_type === 'text') {
      memo = Memo.text(transaction.withdraw_memo);
    } else if (transaction.withdraw_memo_type === 'id') {
      memo = Memo.id(transaction.withdraw_memo);
    }

    const transactionBuilder = new this.stellarSdkService.SDK.TransactionBuilder(loadedAccount, {
      fee: this.stellarSdkService.fee,
      networkPassphrase: this.stellarSdkService.networkPassphrase,
    })
      .addOperation(
        this.stellarSdkService.SDK.Operation.payment({
          asset: new this.stellarSdkService.SDK.Asset(
            anchorCurrency.code,
            anchorCurrency.issuer,
          ),
          amount: transaction.amount_in,
          destination: transaction.withdraw_anchor_account,
        }),
      )
      .setTimeout(this.stellarSdkService.defaultTimeout);

    if (!!memo) {
      transactionBuilder.addMemo(memo);
    }

    const transactionBuild = transactionBuilder.build();

    this.nzDrawerService.create<XdrSignerComponent>({
      nzContent: XdrSignerComponent,
      nzTitle: 'Complete Withdrawal',
      nzWrapClassName: 'drawer-full-w-340 ios-safe-y',
      nzPlacement: 'right',
      nzContentParams: {
        xdr: transactionBuild.toXDR(),
        signingResultsHandler: data => {
          const loadingMessageId = this.nzMessageService.loading('Loading...', { nzDuration: 0 }).messageId;
          this.stellarSdkService.submit(data.transaction)
            .then(_ => {
              this.nzMessageService.remove(loadingMessageId);
              this.nzMessageService.success(this.translateService.instant('SUCCESS_MESSAGE.OPERATION_COMPLETED'));
            })
            .catch(_ => {
              this.nzMessageService.remove(loadingMessageId);
              this.nzMessageService.error(this.translateService.instant('ERROR_MESSAGES.NETWORK_REJECTED'));
            });
        }
      }
    });
  }

}

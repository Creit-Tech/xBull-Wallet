import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, firstValueFrom, merge, Observable, Subject, Subscription } from 'rxjs';
import {
  HorizonApisQuery, ILpAsset,
  ILpAssetLoaded,
  IWalletsAccount,
  LpAssetsQuery,
  WalletsAccountsQuery,
} from '~root/state';
import {
  filter,
  map, shareReplay,
  switchMap, take,
  takeUntil,
  tap,
  withLatestFrom,
} from 'rxjs/operators';
import { Horizon } from 'stellar-sdk';
import BalanceLine = Horizon.HorizonApi.BalanceLine;
import { LiquidityPoolsService } from '~root/core/services/liquidity-pools.service';
import { NzMarks } from 'ng-zorro-antd/slider';
import BigNumber from 'bignumber.js';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import { XdrSignerComponent } from '~root/shared/shared-modals/components/xdr-signer/xdr-signer.component';
import { NzMessageService } from 'ng-zorro-antd/message';
import { WalletsAccountsService } from '~root/core/wallets/services/wallets-accounts.service';
import { ENV, environment } from '~env';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-withdraw-liquidity',
  templateUrl: './withdraw-liquidity.component.html',
  styleUrls: ['./withdraw-liquidity.component.scss']
})
export class WithdrawLiquidityComponent implements OnInit, OnDestroy {
  isMobilePlatform = this.env.platform === 'mobile';
  componentDestroyed$: Subject<void> = new Subject<void>();

  actionButton$: Subject<void> = new Subject<void>();

  selectedAccount$ = this.walletsAccountsQuery.getSelectedAccount$;
  withdrawingLiquidity$ = this.lpAssetsQuery.withdrawingLiquidity$;

  disableActionButtons$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  sliderMarks: NzMarks = {
    0: '0%',
    25: '25%',
    50: '50%',
    75: '75%',
    100: '100%',
  };

  withDrawForm: UntypedFormGroup = new UntypedFormGroup({
    selectedPoolId: new UntypedFormControl(undefined, Validators.required),
    amountToWithdraw: new UntypedFormControl(0, [Validators.required, Validators.min(0.0000001)]),
    percentage: new UntypedFormControl(0, Validators.required),
    errorPercentage: new UntypedFormControl(0.005, Validators.required),
  });

  selectedLiquidityPool$: Observable<ILpAssetLoaded> = this.withDrawForm.controls.selectedPoolId
    .valueChanges
    .pipe(shareReplay(1))
    .pipe(switchMap(selectedPoolId =>
      this.lpAssetsQuery.selectEntity(selectedPoolId) as Observable<ILpAssetLoaded>
    ));

  reloadAccountBalances$: Subject<void> = new Subject<void>();

  accountBalances$: Observable<BalanceLine<'liquidity_pool_shares'>[]> = this.selectedAccount$
    .pipe(filter<any>(Boolean))
    .pipe(map((selectedAccount: IWalletsAccount) => {
      return selectedAccount.accountRecord
        ? selectedAccount.accountRecord.balances
          .filter(b =>
            b.asset_type === 'liquidity_pool_shares'
            && new BigNumber(b.balance).isGreaterThan(0)
          ) as BalanceLine<'liquidity_pool_shares'>[]
        : [];
    }));

  selectedBalance$: Observable<string> = combineLatest([
    this.accountBalances$,
    this.selectedLiquidityPool$
  ])
    .pipe(map(([balances, selectedLiquidityPool]) => {
      return selectedLiquidityPool && balances.find(b => b.liquidity_pool_id === selectedLiquidityPool._id);
    }))
    .pipe(map(balanceLine => {
      return balanceLine?.balance || '0';
    }));

  liquidityPools$ = this.accountBalances$
    .pipe(switchMap(balances => {
      return this.lpAssetsQuery.selectMany(balances.map(b => b.liquidity_pool_id));
    }));

  selectOptions$: Observable<Array<{ value: string; label: string }>> = this.liquidityPools$
    .pipe(filter<any>(liquidityPools => liquidityPools.every((lp: ILpAsset) => lp.dataLoaded)))
    .pipe(map((liquidityPools: ILpAssetLoaded[]) => {
      return liquidityPools.map(lp => ({
        value: lp._id,
        label: lp.reserves
          .map(r => r.asset === 'native' ? 'XLM' : r.asset.split(':')[0])
          .join('/')
      }));
    }));

  constructor(
    private readonly lpAssetsQuery: LpAssetsQuery,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly walletsAccountsService: WalletsAccountsService,
    private readonly liquidityPoolsService: LiquidityPoolsService,
    private readonly horizonApiQuery: HorizonApisQuery,
    private readonly stellarSdkService: StellarSdkService,
    private readonly nzDrawerService: NzDrawerService,
    private readonly nzMessageService: NzMessageService,
    @Inject(ENV)
    private readonly env: typeof environment,
    private readonly translateService: TranslateService,
  ) { }

  fetchLiquidityPoolsDataSubscription: Subscription = this.accountBalances$
    .pipe(withLatestFrom(this.horizonApiQuery.getSelectedHorizonApi$))
    .pipe(switchMap(([accountBalances, horizonApi]) => {
      return Promise.all(accountBalances.map(ab => {
        return this.liquidityPoolsService.getLiquidityPoolsData({
          lpId: ab.liquidity_pool_id,
          horizonApi,
        }).catch(e => {
          console.error(e);
          return e;
        });
      }));
    }))
    .pipe(takeUntil(this.componentDestroyed$))
    .subscribe();

  updatePercentageSubscription: Subscription = this.withDrawForm.controls.amountToWithdraw.valueChanges
    .pipe(withLatestFrom(this.selectedBalance$))
    .pipe(takeUntil(this.componentDestroyed$))
    .subscribe(([value, selectedBalance]) => {
      const percentage = new BigNumber(value)
        .dividedBy(selectedBalance)
        .multipliedBy(100)
        .toNumber();

      this.withDrawForm.controls.percentage.patchValue(percentage, {
        emitEvent: false,
      });
    });

  updateAmountToWithdrawSubscription: Subscription = combineLatest([
    this.withDrawForm.controls.percentage.valueChanges,
    this.selectedBalance$
  ])
    .pipe(takeUntil(this.componentDestroyed$))
    .subscribe(([percentageValue, selectedBalance]) => {
      const amountToWithdraw = new BigNumber(percentageValue)
        .dividedBy(100)
        .multipliedBy(selectedBalance)
        .toFixed(7);

      this.withDrawForm.controls.amountToWithdraw.patchValue(parseFloat(amountToWithdraw), {
        emitEvent: false,
      });
    });

  watchIfAmountIsHigherThanAvailableSubscription: Subscription = this.withDrawForm.controls.amountToWithdraw.valueChanges
    .pipe(withLatestFrom(this.selectedBalance$))
    .pipe(takeUntil(this.componentDestroyed$))
    .subscribe(([value, selectedBalance]) => {
      if (!!selectedBalance) {
        if (new BigNumber(value).isGreaterThan(selectedBalance)) {
          this.withDrawForm.controls.amountToWithdraw.patchValue(
            new BigNumber(selectedBalance).toNumber(), {
            emitEvent: false
          });
        }
      }
    });

  onActionButtonClickedSubscription: Subscription = this.actionButton$.asObservable()
    .pipe(tap(() => this.disableActionButtons$.next(true)))
    .pipe(switchMap(() => {
      return this.onWithdraw()
        .catch(error => {
          this.nzMessageService.error(this.translateService.instant('ERROR_MESSAGES.UNEXPECTED_ERROR'));
          return error;
        });
    }))
    .pipe(tap(() => this.disableActionButtons$.next(false)))
    .pipe(takeUntil(this.componentDestroyed$))
    .subscribe();

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  calculateSpotPrice(data: ILpAssetLoaded): string {
    return new BigNumber(data.reserves[0].amount)
      .dividedBy(data.reserves[1].amount)
      .toFixed(7);
  }

  async onWithdraw(): Promise<void> {
    if (this.withDrawForm.invalid) {
      return;
    }

    const [
      selectedLiquidityPool,
      selectedAccount,
      horizonApi
    ] = await Promise.all([
      firstValueFrom(this.selectedLiquidityPool$),
      firstValueFrom(this.selectedAccount$),
      firstValueFrom(this.horizonApiQuery.getSelectedHorizonApi$)
    ]);

    if (!selectedLiquidityPool || !selectedAccount) {
      return;
    }

    let loadedAccount;
    try {
      loadedAccount = await this.stellarSdkService.selectServer(horizonApi.url)
        .loadAccount(selectedAccount.publicKey);
    } catch (e: any) {
      this.nzMessageService.error(this.translateService.instant('ERROR_MESSAGES.CANT_FETCH_ACCOUNT_FROM_HORIZON'), {
        nzDuration: 5000,
      });
      return;
    }

    const account = new this.stellarSdkService.SDK.Account(loadedAccount.accountId(), loadedAccount.sequence);

    const transactionBuilder = new this.stellarSdkService.SDK.TransactionBuilder(account, {
      fee: this.stellarSdkService.fee,
      networkPassphrase: this.stellarSdkService.networkPassphrase,
    })
      .setTimeout(this.stellarSdkService.defaultTimeout)
      .addOperation(
        this.stellarSdkService.SDK.Operation.liquidityPoolWithdraw({
          liquidityPoolId: selectedLiquidityPool._id,
          amount: new BigNumber(this.withDrawForm.value.amountToWithdraw)
            .toFixed(7),
          minAmountA: new BigNumber(this.withDrawForm.value.amountToWithdraw)
            .dividedBy(selectedLiquidityPool.totalShares)
            .multipliedBy(selectedLiquidityPool.reserves[0].amount)
            .multipliedBy(new BigNumber(1).minus(this.withDrawForm.value.errorPercentage))
            .toFixed(7),
          minAmountB: new BigNumber(this.withDrawForm.value.amountToWithdraw)
            .dividedBy(selectedLiquidityPool.totalShares)
            .multipliedBy(selectedLiquidityPool.reserves[1].amount)
            .multipliedBy(new BigNumber(1).minus(this.withDrawForm.value.errorPercentage))
            .toFixed(7)
        })
      );

    const drawerRef = this.nzDrawerService.create<XdrSignerComponent>({
      nzContent: XdrSignerComponent,
      nzContentParams: {
        xdr: transactionBuilder.build().toXDR()
      },
      nzWrapClassName: 'drawer-full-w-340 ios-safe-y',
      nzTitle: this.translateService.instant('SUCCESS_MESSAGE.OPERATION_COMPLETED'),
    });

    drawerRef.open();

    await drawerRef.afterOpen.pipe(take(1)).toPromise();

    const componentRef = drawerRef.getContentComponent();

    if (!componentRef) {
      return;
    }

    const signedXdr = await componentRef.accept
      .pipe(take(1))
      .pipe(takeUntil(
        merge(this.componentDestroyed$, drawerRef.afterClose)
      ))
      .toPromise();

    if (!signedXdr) {
      return;
    }

    drawerRef.close();
    await this.liquidityPoolsService.withdrawLiquidity(signedXdr)
      .then(() => {
        this.nzMessageService.success(this.translateService.instant('SUCCESS_MESSAGE.OPERATION_COMPLETED'));
      })
      .catch(error => {
        console.error(error);
        this.nzMessageService.error(this.translateService.instant('ERROR_MESSAGES.NETWORK_REJECTED'));
      });

    this.reloadAccountBalances$.next();

    this.walletsAccountsService.getAccountData({
      account: selectedAccount,
      horizonApi
    })
      .subscribe();

    this.withDrawForm.patchValue({
      amountToWithdraw: 0,
      percentage: 0,
      errorPercentage: 0.005,
    });
  }

}

export interface IWithdrawForm {
  selectedPoolId: string;
  amountToWithdraw: number;
  percentage: number;
  errorPercentage: number;
}

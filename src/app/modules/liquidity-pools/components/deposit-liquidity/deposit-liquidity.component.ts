import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import {
  BalanceAssetType,
  HorizonApisQuery,
  IWalletAsset, IWalletAssetModel, IWalletsAccount,
  LpAssetsQuery, LpAssetsStore,
  WalletsAccountsQuery,
  WalletsAssetsQuery,
} from '~root/state';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  pluck, skip,
  startWith,
  switchMap, take,
  takeUntil, tap,
  withLatestFrom,
} from 'rxjs/operators';
import { LiquidityPoolsService } from '~root/core/services/liquidity-pools.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { WalletsAssetsService } from '~root/core/wallets/services/wallets-assets.service';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import BigNumber from 'bignumber.js';
import { BehaviorSubject, from, merge, Observable, of, Subject, Subscription } from 'rxjs';
import { AccountResponse, Horizon, LiquidityPoolFeeV18, ServerApi, TransactionBuilder } from 'stellar-sdk';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import { XdrSignerComponent } from '~root/shared/modals/components/xdr-signer/xdr-signer.component';
import { WalletsAccountsService } from '~root/core/wallets/services/wallets-accounts.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-deposit-liquidity',
  templateUrl: './deposit-liquidity.component.html',
  styleUrls: ['./deposit-liquidity.component.scss']
})
export class DepositLiquidityComponent implements OnInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();
  actionButton$: Subject<'deposit' | 'create'> = new Subject<'deposit' | 'create'>();

  selectedAccount$ = this.walletsAccountsQuery.getSelectedAccount$;

  depositingLiquidity$ = this.lpAssetsQuery.depositingLiquidity$;
  creatingPool$ = this.walletAssetsQuery.addingAsset$;

  selectedLiquidityPool$: BehaviorSubject<ServerApi.LiquidityPoolRecord | undefined> =
    new BehaviorSubject<ServerApi.LiquidityPoolRecord | undefined>(undefined);

  disableActionButtons$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  showCreateLPButton$: Observable<boolean> = this.selectedLiquidityPool$
    .pipe(skip(1))
    .pipe(map(response => {
      return !response
        && !!this.depositForm.value.assetABalanceLine
        && !!this.depositForm.value.assetBBalanceLine;
    }));

  accountBalances$ = this.selectedAccount$
    .pipe(filter<any>(Boolean))
    .pipe(map((selectedAccount: IWalletsAccount): BalanceAssetType[] => {
      return this.walletsAssetsService.filterBalancesLines(selectedAccount.accountRecord?.balances || []);
    }));

  depositForm: FormGroup = new FormGroup({
    amountAssetA: new FormControl('0', [Validators.required, Validators.min(0.0000001)]),
    multiplierA: new FormControl(undefined),
    assetABalanceLine: new FormControl(undefined, Validators.required),
    amountAssetB: new FormControl('0', [Validators.required, Validators.min(0.0000001)]),
    multiplierB: new FormControl(undefined),
    assetBBalanceLine: new FormControl(undefined, Validators.required),
    errorPercentage: new FormControl(0.005, Validators.required),
  });

  assetA$: Observable<IWalletAssetModel | undefined> = this.depositForm.valueChanges
    .pipe(startWith(this.depositForm.value))
    .pipe(pluck('assetABalanceLine'))
    .pipe(filter<any>(Boolean))
    .pipe(switchMap((assetABalanceLine: BalanceAssetType) => {
      const assetId = this.walletsAssetsService.formatBalanceLineId(assetABalanceLine);
      return this.walletAssetsQuery.selectEntity(assetId);
    }));

  availableAssetAFunds$ = this.assetA$
    .pipe(withLatestFrom(this.selectedAccount$))
    .pipe(map(([selectedAsset, selectedAccount]) => {
      return this.calculateAvailableFunds(selectedAsset, selectedAccount);
    }));

  assetB$: Observable<IWalletAssetModel | undefined> = this.depositForm.valueChanges
    .pipe(startWith(this.depositForm.value))
    .pipe(pluck('assetBBalanceLine'))
    .pipe(filter<any>(Boolean))
    .pipe(switchMap((assetABalanceLine: BalanceAssetType) => {
      const assetId = this.walletsAssetsService.formatBalanceLineId(assetABalanceLine);
      return this.walletAssetsQuery.selectEntity(assetId);
    }));

  availableAssetBFunds$ = this.assetB$
    .pipe(withLatestFrom(this.selectedAccount$))
    .pipe(map(([selectedAsset, selectedAccount]) => {
      return this.calculateAvailableFunds(selectedAsset, selectedAccount);
    }));

  constructor(
    private readonly liquidityPoolsService: LiquidityPoolsService,
    private readonly lpAssetsQuery: LpAssetsQuery,
    private readonly lpAssetsStore: LpAssetsStore,
    private readonly cdr: ChangeDetectorRef,
    private readonly horizonApisQuery: HorizonApisQuery,
    private readonly nzMessageService: NzMessageService,
    private readonly walletAssetsQuery: WalletsAssetsQuery,
    private readonly walletsAssetsService: WalletsAssetsService,
    private readonly stellarSdkService: StellarSdkService,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly nzDrawerService: NzDrawerService,
    private readonly walletsAccountsService: WalletsAccountsService,
    private readonly translateService: TranslateService,
  ) { }

  getLiquidityPoolSubscription: Subscription = this.depositForm.valueChanges
    .pipe(map(values => ({
      assetABalanceLine: values.assetABalanceLine,
      assetBBalanceLine: values.assetBBalanceLine,
    })))
    .pipe(distinctUntilChanged((a, b) => {
      return a.assetABalanceLine === b.assetABalanceLine
        && a.assetBBalanceLine === b.assetBBalanceLine;
    }))
    .pipe(takeUntil(this.componentDestroyed$))
    .subscribe(() => {
      this.getLiquidityPool()
        .then()
        .catch(error => {
          console.error(error);
          this.nzMessageService.error(this.translateService.instant('ERROR_MESSAGES.CANT_CONTACT_HORIZON'));
        });
    });

  setMultipliersSubscription: Subscription = this.selectedLiquidityPool$
    .pipe(takeUntil(this.componentDestroyed$))
    .subscribe(liquidityPool => {
      if (!liquidityPool) {
        this.depositForm.patchValue({
          multiplierA: undefined,
          multiplierB: undefined
        });
      } else {
        const spotPrice = this.calculateSpotPrice(liquidityPool);

        if (this.depositForm.value.assetABalanceLine.asset_type === 'native') {
          if (liquidityPool.reserves[0].asset === 'native') {
            this.depositForm.controls.multiplierA.patchValue(spotPrice);
            this.depositForm.controls.multiplierB.patchValue(1 / spotPrice);
          } else if (liquidityPool.reserves[1].asset === 'native') {
            this.depositForm.controls.multiplierA.patchValue(1 / spotPrice);
            this.depositForm.controls.multiplierB.patchValue(spotPrice);
          }
        } else {
          if (
            liquidityPool.reserves[0].asset
            === this.depositForm.value.assetABalanceLine.asset_code + ':' + this.depositForm.value.assetABalanceLine.asset_issuer
          ) {
            this.depositForm.controls.multiplierA.patchValue(spotPrice);
            this.depositForm.controls.multiplierB.patchValue(1 / spotPrice);
          } else if (
            liquidityPool.reserves[1].asset
            === this.depositForm.value.assetABalanceLine.asset_code + ':' + this.depositForm.value.assetABalanceLine.asset_issuer
          ) {
            this.depositForm.controls.multiplierA.patchValue(1 / spotPrice);
            this.depositForm.controls.multiplierB.patchValue(spotPrice);
          }
        }

      }
    });

  calculateAssetAMinSubscription: Subscription = this.depositForm.controls
    .amountAssetB
    .valueChanges
    .pipe(withLatestFrom(this.selectedLiquidityPool$))
    .pipe(takeUntil(this.componentDestroyed$))
    .subscribe(([value, liquidityPool]) => {
      if (!liquidityPool || new BigNumber(liquidityPool.total_shares).isEqualTo(0)) {
        return;
      }

      this.depositForm.controls.amountAssetA.patchValue(
        new BigNumber(value)
          .multipliedBy(this.depositForm.value.multiplierA || 0)
          .toFixed(7),
        {
          emitEvent: false
        }
      );
    });

  calculateAssetBMinSubscription: Subscription = this.depositForm.controls
    .amountAssetA
    .valueChanges
    .pipe(withLatestFrom(this.selectedLiquidityPool$))
    .pipe(takeUntil(this.componentDestroyed$))
    .subscribe(([value, liquidityPool]) => {
      if (!liquidityPool || new BigNumber(liquidityPool.total_shares).isEqualTo(0)) {
        return;
      }

      this.depositForm.controls.amountAssetB.patchValue(
        new BigNumber(value)
          .multipliedBy(this.depositForm.value.multiplierB || 0)
          .toFixed(7),
        {
          emitEvent: false,
        }
      );
    });

  resetAmountsWhenUpdatingPairs: Subscription = merge(
    this.depositForm.controls.assetABalanceLine.valueChanges,
    this.depositForm.controls.assetBBalanceLine.valueChanges,
  )
    .pipe(takeUntil(this.componentDestroyed$))
    .subscribe(() => {
      this.depositForm.patchValue({
        amountAssetA: '0',
        amountAssetB: '0',
      }, {
        emitEvent: false
      });
    });

  onActionClickedSubscription: Subscription = this.actionButton$.asObservable()
    .pipe(debounceTime(300))
    .pipe(tap(() => this.disableActionButtons$.next(true)))
    .pipe(switchMap(async (type) => {
      if (this.depositForm.invalid) {
        return;
      }

      const [
        horizonApi,
        selectedAccount
      ] = await Promise.all([
        this.horizonApisQuery.getSelectedHorizonApi$
          .pipe(take(1))
          .toPromise(),
        this.walletsAccountsQuery.getSelectedAccount$
          .pipe(take(1))
          .toPromise()
      ]);

      if (!selectedAccount || !horizonApi) {
        this.nzMessageService.error(`There was an issue selecting the account to sign, please try again`);
        return;
      }

      let loadedAccount;
      try {
        loadedAccount = await new this.stellarSdkService.SDK.Server(horizonApi.url)
          .loadAccount(selectedAccount.publicKey);
      } catch (e: any) {
        this.nzMessageService.error(this.translateService.instant('ERROR_MESSAGES.CANT_FETCH_ACCOUNT_FROM_HORIZON'), {
          nzDuration: 5000,
        });
        return;
      }

      const account = new this.stellarSdkService.SDK.Account(loadedAccount.account_id, loadedAccount.sequence);

      const transactionBuilder = new this.stellarSdkService.SDK.TransactionBuilder(account, {
        fee: this.stellarSdkService.fee,
        networkPassphrase: this.stellarSdkService.networkPassphrase,
      })
        .setTimeout(this.stellarSdkService.defaultTimeout);

      return (
        type === 'deposit'
          ? this.onDepositLiquidity({ loadedAccount, transactionBuilder })
          : this.onCreatePool({ loadedAccount, transactionBuilder })
      )
        .then(() => {
          return this.walletsAccountsService.getAccountData({
            account: selectedAccount,
            horizonApi
          })
            .pipe(take(1))
            .toPromise()
            .catch(error => {
              console.error(error);
              return error;
            });
        })
        .catch(error => {
          console.error(error);
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

  calculateAvailableFunds(selectedAsset: IWalletAssetModel | undefined, selectedAccount: IWalletsAccount): number {
    if (!selectedAsset || !selectedAccount.accountRecord) {
      console.warn('Balance or Account record is undefined');
      return new BigNumber(0).toNumber();
    }
    const filteredBalances = this.walletsAssetsService
      .filterBalancesLines(selectedAccount.accountRecord.balances);

    const targetBalance = filteredBalances.find(balance => {
      return selectedAsset._id === this.walletsAssetsService.formatBalanceLineId(balance);
    });

    if (!targetBalance) {
      console.warn(`An unexpected balance arrived in this line`);
      return 0;
    }

    return this.stellarSdkService
      .calculateAvailableBalance({
        account: selectedAccount.accountRecord,
        balanceLine: targetBalance,
      })
      .toNumber();
  }

  calculateSpotPrice(data: ServerApi.LiquidityPoolRecord): number {
    return new BigNumber(data.reserves[0].amount)
      .dividedBy(data.reserves[1].amount)
      .toNumber();
  }

  calculateMinAndMaxPrices(params: {
    spotPrice?: string | number | BigNumber
  }): { minPrice: BigNumber; maxPrice: BigNumber } {
    if (!params.spotPrice) {
      params.spotPrice = new BigNumber(this.depositForm.value.amountAssetA)
        .dividedBy(this.depositForm.value.amountAssetB)
        .toFixed(7);
    }

    return {
      maxPrice: new BigNumber(params.spotPrice)
        .multipliedBy(
          new BigNumber(1)
            .plus(this.depositForm.value.errorPercentage)
        ),
      minPrice: new BigNumber(params.spotPrice)
        .multipliedBy(
          new BigNumber(1)
            .minus(this.depositForm.value.errorPercentage)
        ),
    };
  }

  async getLiquidityPool(): Promise<void> {
    const horizonApi = await this.horizonApisQuery.getSelectedHorizonApi$.pipe(take(1)).toPromise();

    if (!this.depositForm.value.assetBBalanceLine || !this.depositForm.value.assetABalanceLine) {
      this.selectedLiquidityPool$.next(undefined);
      return;
    }

    const assetA = this.depositForm.value.assetABalanceLine.asset_type === 'native'
      ? this.stellarSdkService.SDK.Asset.native()
      : new this.stellarSdkService.SDK.Asset(
        this.depositForm.value.assetABalanceLine.asset_code,
        this.depositForm.value.assetABalanceLine.asset_issuer
      );

    const assetB = this.depositForm.value.assetBBalanceLine.asset_type === 'native'
      ? this.stellarSdkService.SDK.Asset.native()
      : new this.stellarSdkService.SDK.Asset(
        this.depositForm.value.assetBBalanceLine.asset_code,
        this.depositForm.value.assetBBalanceLine.asset_issuer
      );

    const server = new this.stellarSdkService.SDK.Server(horizonApi.url);
    server.liquidityPools()
      .forAssets(assetA, assetB)
      .call()
      .then(response => {
        const liquidityPool = response.records.pop();
        const correctAsset = liquidityPool?.reserves.every(r => {
          if (r.asset === 'native') {
            return assetA.isNative() || assetB.isNative();
          } else {
            return r.asset.includes(assetA.code) || r.asset.includes(assetB.code);
          }
        });

        if (!!correctAsset) {
          this.selectedLiquidityPool$.next(liquidityPool);
        } else {
          this.selectedLiquidityPool$.next(undefined);
        }

      });
  }

  async onDepositLiquidity(params: {
    loadedAccount: AccountResponse,
    transactionBuilder: TransactionBuilder,
  }): Promise<void> {
    const liquidityPool = await this.selectedLiquidityPool$
      .pipe(take(1))
      .toPromise();

    if (!liquidityPool) {
      this.nzMessageService.error(`Liquidity pool does not exist or it wasn't loaded correctly`);
      return;
    }

    if (
      !params.loadedAccount.balances.find(b => {
        return b.asset_type === 'liquidity_pool_shares'
          && b.liquidity_pool_id === liquidityPool.id;
      })
    ) {
      const assetA = liquidityPool.reserves[0].asset === 'native'
        ? this.stellarSdkService.SDK.Asset.native()
        : new this.stellarSdkService.SDK.Asset(
          liquidityPool.reserves[0].asset.split(':')[0],
          liquidityPool.reserves[0].asset.split(':')[1]
        );

      const assetB = new this.stellarSdkService.SDK.Asset(
        liquidityPool.reserves[1].asset.split(':')[0],
        liquidityPool.reserves[1].asset.split(':')[1]
      );

      const asset = new this.stellarSdkService.SDK.LiquidityPoolAsset(assetA, assetB, liquidityPool.fee_bp);

      params.transactionBuilder.addOperation(
        this.stellarSdkService.SDK.Operation.changeTrust({ asset })
      );
    }

    const spotPrice = this.calculateSpotPrice(liquidityPool);

    const { minPrice, maxPrice } = this.calculateMinAndMaxPrices({ spotPrice });

    params.transactionBuilder
      .addOperation(
        this.stellarSdkService.SDK.Operation.liquidityPoolDeposit({
          liquidityPoolId: liquidityPool.id,
          maxAmountA: new BigNumber(this.depositForm.value.amountAssetA)
            .toFixed(7),
          maxAmountB: new BigNumber(this.depositForm.value.amountAssetB)
            .toFixed(7),
          maxPrice,
          minPrice
        })
      );

    const drawerRef = this.nzDrawerService.create<XdrSignerComponent>({
      nzContent: XdrSignerComponent,
      nzContentParams: {
        xdr: params.transactionBuilder.build().toXDR(),
      },
      nzWrapClassName: 'drawer-full-w-320 ios-safe-y',
      nzTitle: this.translateService.instant('COMMON_WORDS.DEPOSIT')
    });

    drawerRef.open();

    await drawerRef.afterOpen.pipe(take(1)).toPromise();

    const componentRef = drawerRef.getContentComponent();

    if (!componentRef) {
      drawerRef.close();
      return;
    }

    const signedXdr = await componentRef.accept
      .asObservable()
      .pipe(take(1))
      .pipe(takeUntil(
        merge(
          this.componentDestroyed$,
          drawerRef.afterClose
        )
      ))
      .toPromise();

    if (!!signedXdr) {
      try {
        drawerRef.close();
        await this.liquidityPoolsService.depositLiquidity(signedXdr);
        this.nzMessageService.success(this.translateService.instant('SUCCESS_MESSAGE.OPERATION_COMPLETED'));

        this.depositForm.patchValue({
          amountAssetA: '0',
          multiplierA: undefined,
          assetABalanceLine: undefined,
          amountAssetB: '0',
          multiplierB: undefined,
          assetBBalanceLine: undefined,
          errorPercentage: 0.005,
        });
      } catch (e: any) {
        console.error(e);
        this.nzMessageService.error(this.translateService.instant('ERROR_MESSAGES.NETWORK_REJECTED'));
      }
    }

    try {
      await this.getLiquidityPool();
    } catch (e: any) {

    }
  }

  async onCreatePool(params: {
    loadedAccount: AccountResponse,
    transactionBuilder: TransactionBuilder,
  }): Promise<void> {
    const A = this.depositForm.value.assetABalanceLine.asset_type === 'native'
      ? this.stellarSdkService.SDK.Asset.native()
      : new this.stellarSdkService.SDK.Asset(
        this.depositForm.value.assetABalanceLine.asset_code,
        this.depositForm.value.assetABalanceLine.asset_issuer
      );

    const B = this.depositForm.value.assetBBalanceLine.asset_type === 'native'
      ? this.stellarSdkService.SDK.Asset.native()
      : new this.stellarSdkService.SDK.Asset(
        this.depositForm.value.assetBBalanceLine.asset_code,
        this.depositForm.value.assetBBalanceLine.asset_issuer
      );

    const [assetA, assetB] = this.liquidityPoolsService.orderAssets(A, B);

    const asset = new this.stellarSdkService.SDK.LiquidityPoolAsset(
      assetA,
      assetB,
      this.stellarSdkService.SDK.LiquidityPoolFeeV18,
    );

    params.transactionBuilder.addOperation(
      this.stellarSdkService.SDK.Operation.changeTrust({ asset })
    );

    const drawerRef = this.nzDrawerService.create<XdrSignerComponent>({
      nzContent: XdrSignerComponent,
      nzContentParams: {
        xdr: params.transactionBuilder.build().toXDR(),
      },
      nzTitle: this.translateService.instant('COMMON_WORDS.CREATE'),
      nzWrapClassName: 'drawer-full-w-320 ios-safe-y',
    });

    drawerRef.open();

    await drawerRef.afterOpen.pipe(take(1)).toPromise();

    const componentRef = drawerRef.getContentComponent();

    if (!componentRef) {
      drawerRef.close();
      return;
    }

    const signedXdr = await componentRef.accept
      .asObservable()
      .pipe(take(1))
      .pipe(takeUntil(
        merge(
          this.componentDestroyed$,
          drawerRef.afterClose
        )
      ))
      .toPromise();

    if (!!signedXdr) {
      try {
        drawerRef.close();
        await this.walletsAssetsService.addAssetToAccount(signedXdr);
        this.nzMessageService.success(this.translateService.instant('SUCCESS_MESSAGE.OPERATION_COMPLETED'));
      } catch (e: any) {
        console.error(e);
        this.nzMessageService.error(this.translateService.instant('ERROR_MESSAGES.NETWORK_REJECTED'));
      }
    }

    try {
      await this.getLiquidityPool();
    } catch (e: any) {

    }
  }

}


export interface IDepositForm {
  amountAssetA: string;
  multiplierA: number | undefined;
  assetABalanceLine: BalanceAssetType;
  multiplierB: number | undefined;
  amountAssetB: string;
  assetBBalanceLine: BalanceAssetType;
  errorPercentage: number;
}

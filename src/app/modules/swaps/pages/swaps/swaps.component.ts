import { Component, OnDestroy, OnInit } from '@angular/core';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import { AssetSearcherComponent } from '~root/shared/asset-searcher/asset-searcher.component';
import {
  IWalletAssetIssued,
  IWalletAssetModel,
  IWalletAssetNative,
  WalletsAccountsQuery,
  WalletsAssetsQuery, WalletsOffersQuery
} from '~root/state';
import { debounceTime, map, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { BehaviorSubject, combineLatest, Observable, of, ReplaySubject, Subject, Subscription } from 'rxjs';
import { WalletsAssetsService } from '~root/core/wallets/services/wallets-assets.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AccountResponse, ServerApi } from 'stellar-sdk';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import BigNumber from 'bignumber.js';
import { XdrSignerComponent } from '~root/shared/modals/components/xdr-signer/xdr-signer.component';
import { WalletsOffersService } from '~root/core/wallets/services/wallets-offers.service';

@Component({
  selector: 'app-swaps',
  templateUrl: './swaps.component.html',
  styleUrls: ['./swaps.component.scss']
})
export class SwapsComponent implements OnInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();

  selectedWalletAccount$ = this.walletAccountsQuery.getSelectedAccount$;

  gettingPathPaymentRecord$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  sendingPathPayment$ = this.walletOffersQuery.sendingPathPayment$;
  swapAssets$: Subject<void> = new Subject<void>();
  confirmingSwapAssets$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  myAssets$: Observable<IWalletAssetModel[]> = this.selectedWalletAccount$
    .pipe(switchMap(selectedWalletAccount => {
      if (!selectedWalletAccount || !selectedWalletAccount.accountRecord) {
        return of([]);
      }

      const assetsIds = this.walletsAssetsService.filterBalancesLines(selectedWalletAccount.accountRecord.balances)
        .map(b => this.walletsAssetsService.formatBalanceLineId(b));

      return this.walletsAssetsQuery.getAssetsById(assetsIds);
    }));

  swapForm: FormGroup = new FormGroup({
    fromAsset: new FormGroup({
      amount: new FormControl(0, [
        Validators.required,
        Validators.min(0.0000001)
      ]),
      asset: new FormControl('', [Validators.required]),
    }, [Validators.required]),
    toAsset: new FormGroup({
      amount: new FormControl(0, [
        Validators.required,
        Validators.min(0.0000001)
      ]),
      asset: new FormControl('', [Validators.required]),
    }, [Validators.required]),
    pathType: new FormControl('send', [Validators.required]),
    slippageTolerance: new FormControl(0.005, [Validators.required]),
    path: new FormControl(undefined, [Validators.required]),
    exchangeRate: new FormControl(undefined, [Validators.required]),
  });

  get slippageTolerance(): FormControl {
    return this.swapForm.controls.slippageTolerance as FormControl;
  }

  get formPathType(): FormControl {
    return this.swapForm.controls.pathType as FormControl;
  }

  get pathTypeValue(): 'send' | 'receive' {
    return this.swapForm.controls.pathType.value;
  }

  get fromAssetAmount(): FormControl {
    return (this.swapForm.controls.fromAsset as FormGroup).controls.amount as FormControl;
  }

  get toAssetAmount(): FormControl {
    return (this.swapForm.controls.toAsset as FormGroup).controls.amount as FormControl;
  }

  get pathValue(): ServerApi.PaymentPathRecord | undefined {
    return this.swapForm.value.path;
  }

  get exchangeRate(): IExchangeRate {
    return this.swapForm.value.exchangeRate;
  }

  fundsAvailableToSend$: Observable<string> = this.swapForm.controls.fromAsset.valueChanges
    .pipe(switchMap((value: IAssetFormField) => {
      return this.selectedWalletAccount$
        .pipe(map(walletAccount => {
          if (!walletAccount || !walletAccount.accountRecord || !value.asset) {
            return '0';
          }
          const targetBalance = this.walletsAssetsService.filterBalancesLines(walletAccount.accountRecord.balances).find(b => {
            return value.asset._id === this.walletsAssetsService.formatBalanceLineId(b);
          });

          if (!targetBalance) {
            return '0';
          }

          return this.stellarSdkService.calculateAvailableBalance({
            account: walletAccount.accountRecord,
            balanceLine: targetBalance
          }).toFixed(7);
        }));
    }));

  constructor(
    private readonly walletsAssetsQuery: WalletsAssetsQuery,
    private readonly walletsAssetsService: WalletsAssetsService,
    private readonly walletAccountsQuery: WalletsAccountsQuery,
    private readonly nzMessageService: NzMessageService,
    private readonly stellarSdkService: StellarSdkService,
    private readonly nzDrawerService: NzDrawerService,
    private readonly walletsOffersService: WalletsOffersService,
    private readonly walletOffersQuery: WalletsOffersQuery,
  ) { }

  updatePathFromHorizonSubscription: Subscription = combineLatest([
    this.swapForm.controls.fromAsset.valueChanges,
    this.swapForm.controls.toAsset.valueChanges,
  ])
    .pipe(debounceTime(1000))
    .pipe(takeUntil(this.componentDestroyed$))
    .subscribe(async _ => {
      this.gettingPathPaymentRecord$.next(true);
      try {
        await this.updatePaymentPath();
      } catch (e) {

      }
      this.gettingPathPaymentRecord$.next(false);
    });

  setStrictSendTypeSubscription: Subscription = this.fromAssetAmount.valueChanges
    .pipe(takeUntil(this.componentDestroyed$))
    .subscribe(_ => {
      this.formPathType.setValue('send', { emitEvent: false });
    });

  setStrictReceiveTypeSubscription: Subscription = this.toAssetAmount.valueChanges
    .pipe(takeUntil(this.componentDestroyed$))
    .subscribe(_ => {
      this.formPathType.setValue('receive', { emitEvent: false });
    });

  swapAssetsSubscription: Subscription = this.swapAssets$.asObservable()
    .pipe(debounceTime(80))
    .pipe(takeUntil(this.componentDestroyed$))
    .subscribe(async _ => {
      this.confirmingSwapAssets$.next(true);
      try {
        await this.confirmSwap();
      } catch (e) {

      }
      this.confirmingSwapAssets$.next(false);
    });

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  async searchAsset(formValue: 'from' | 'to'): Promise<void> {
    const myAssets = await this.myAssets$.pipe(take(1)).toPromise();

    const drawer = this.nzDrawerService.create<AssetSearcherComponent>({
      nzContent: AssetSearcherComponent,
      nzPlacement: 'bottom',
      nzTitle: 'Select Asset',
      nzHeight: '100%',
      nzCloseOnNavigation: true,
      nzContentParams: {
        defaultAssets: myAssets,
        assetSelectedFunc: asset => {
          if (formValue === 'from') {
            this.swapForm.get(['fromAsset', 'asset'])?.setValue(asset);
          }

          if (formValue === 'to') {
            this.swapForm.get(['toAsset', 'asset'])?.setValue(asset);
          }
        },
        disableCustomAsset: formValue === 'from',
        disableCuratedAssetByCreitTech: formValue === 'from',
      }
    });

  }

  async updatePaymentPath(): Promise<void> {
    if (
      (this.swapForm.controls.fromAsset.invalid && this.pathTypeValue === 'send')
      ||
      (this.swapForm.controls.toAsset.invalid && this.pathTypeValue === 'receive')
    ) {
      return;
    }

    const fromAsset: IWalletAssetIssued | IWalletAssetNative = this.swapForm.value.fromAsset.asset;
    const toAsset: IWalletAssetIssued | IWalletAssetNative = this.swapForm.value.toAsset.asset;

    let response: { records: ServerApi.PaymentPathRecord[] };
    if (this.pathTypeValue === 'send') {
      response = await this.stellarSdkService.Server.strictSendPaths(
        this.walletsAssetsService.sdkAssetFromAssetId(fromAsset._id),
        new BigNumber(this.fromAssetAmount.value).toFixed(7),
        [this.walletsAssetsService.sdkAssetFromAssetId(toAsset._id)]
      ).call().catch(error => {
        console.error(error);
        return { records: [] };
      });
    } else if (this.pathTypeValue === 'receive') {
      response = await this.stellarSdkService.Server.strictReceivePaths(
        [this.walletsAssetsService.sdkAssetFromAssetId(fromAsset._id)],
        this.walletsAssetsService.sdkAssetFromAssetId(toAsset._id),
        new BigNumber(this.toAssetAmount.value).toFixed(7),
      ).call().catch(error => {
        console.error(error);
        return { records: [] };
      });
    } else {
      console.warn('path type is not correct');
      return;
    }

    const cheapestPath = response.records.shift();

    if (!cheapestPath) {
      this.nzMessageService.error('There are no active offers we can use to swap these assets');
      return;
    }

    this.swapForm.get('path')?.setValue(cheapestPath, { emitEvent: false });

    if (this.pathTypeValue === 'send') {
      this.toAssetAmount.setValue(cheapestPath.destination_amount, { emitEvent: false });
    } else {
      this.fromAssetAmount.setValue(cheapestPath.source_amount, { emitEvent: false });
    }

    const exchangeRate: IExchangeRate = {
      numerator: fromAsset.assetCode,
      denominator: toAsset.assetCode,
      amount: this.calculateRate(),
    };
    this.swapForm.controls.exchangeRate.setValue(exchangeRate, { emitEvent: false });
  }

  maxToSend(maxSendAmount?: string): string {
    if (!maxSendAmount) {
      return '0';
    }
    return new BigNumber(maxSendAmount)
      .multipliedBy(
        new BigNumber('1')
          .plus(this.slippageTolerance.value)
      )
      .toFixed(7);
  }

  minToReceive(minReceiveAmount?: string): string {
    if (!minReceiveAmount) {
      return '0';
    }
    return new BigNumber(minReceiveAmount)
      .multipliedBy(
        new BigNumber('1')
          .minus(this.slippageTolerance.value)
      )
      .toFixed(7);
  }

  calculateRate(): string {
    if (!(new BigNumber(this.toAssetAmount.value).isGreaterThan(0))) {
      return '0';
    }
    return new BigNumber(this.fromAssetAmount.value)
      .dividedBy(this.toAssetAmount.value)
      .toFixed(7);
  }

  async confirmSwap(): Promise<void> {
    const selectedAccount = await this.walletAccountsQuery.getSelectedAccount$.pipe(take(1)).toPromise();
    const updatedPath = this.pathValue;

    const fromAsset: IWalletAssetIssued | IWalletAssetNative = this.swapForm.value.fromAsset.asset;
    const fromAssetClass = fromAsset._id === 'native'
      ? this.stellarSdkService.SDK.Asset.native()
      : new this.stellarSdkService.SDK.Asset(fromAsset.assetCode, (fromAsset as IWalletAssetIssued).assetIssuer);

    const toAsset: IWalletAssetIssued | IWalletAssetNative = this.swapForm.value.toAsset.asset;
    const toAssetClass = toAsset._id === 'native'
      ? this.stellarSdkService.SDK.Asset.native()
      : new this.stellarSdkService.SDK.Asset(toAsset.assetCode, (toAsset as IWalletAssetIssued).assetIssuer);

    let loadedAccount: AccountResponse;
    try {
      loadedAccount = await this.stellarSdkService.Server.loadAccount(selectedAccount.publicKey);
    } catch (e) {
      this.nzMessageService.error('We were not able to load your account from the blockchain, make sure you are using the correct horizon and you have internet.');
      return;
    }

    if (!updatedPath) {
      this.nzMessageService.error('There is no valid path to make the swap.');
      return;
    }

    const transactionBuilder = new this.stellarSdkService.SDK.TransactionBuilder(
      new this.stellarSdkService.SDK.Account(loadedAccount.accountId(), loadedAccount.sequence),
      {
        fee: this.stellarSdkService.fee,
        networkPassphrase: this.stellarSdkService.networkPassphrase,
      }
    ).setTimeout(this.stellarSdkService.defaultTimeout);

    let hasTrustline = true;
    if (toAsset._id !== 'native') {
      hasTrustline = !!this.walletsAssetsService.filterBalancesLines(loadedAccount.balances)
        .find(b => {
          return b.asset_type !== 'native'
            && b.asset_code === toAsset.assetCode
            && b.asset_issuer === (toAsset as IWalletAssetIssued).assetIssuer;
        });
    }

    if (!hasTrustline) {
      transactionBuilder.addOperation( this.stellarSdkService.SDK.Operation.changeTrust({ asset: toAssetClass }) );
    }

    const path = updatedPath.path.map(item =>
      item.asset_type === 'native'
        ? this.stellarSdkService.SDK.Asset.native()
        : new this.stellarSdkService.SDK.Asset(item.asset_code, item.asset_issuer)
    );

    if (this.pathTypeValue === 'send') {
      transactionBuilder.addOperation(
        this.stellarSdkService.SDK.Operation.pathPaymentStrictSend({
          destination: loadedAccount.accountId(),
          destAsset: toAssetClass,
          sendAsset: fromAssetClass,
          destMin: this.minToReceive(this.toAssetAmount.value),
          sendAmount: new BigNumber(this.fromAssetAmount.value).toFixed(7),
          path
        })
      );
    } else if (this.pathTypeValue === 'receive') {
      transactionBuilder.addOperation(
        this.stellarSdkService.SDK.Operation.pathPaymentStrictReceive({
          destination: loadedAccount.accountId(),
          destAsset: toAssetClass,
          sendAsset: fromAssetClass,
          destAmount: new BigNumber(this.toAssetAmount.value).toFixed(7),
          sendMax: this.maxToSend(this.toAssetAmount.value),
          path
        })
      );
    } else {
      this.nzMessageService.error('Type of path selected is not Send or Receive, contact support');
      return;
    }

    const formattedXDR = transactionBuilder.build().toXDR();

    this.nzDrawerService.create<XdrSignerComponent>({
      nzContent: XdrSignerComponent,
      nzWrapClassName: 'drawer-full-w-320',
      nzCloseOnNavigation: true,
      nzTitle: 'Swap confirmation',
      nzContentParams: {
        xdr: formattedXDR,
        acceptHandler: async signedXdr => {
          try {
            await this.walletsOffersService.sendPathPayment(signedXdr);
            this.nzMessageService.success('The swap of the assets were successful');
          } catch (e: any) {
            this.nzMessageService.error('The swap was rejected by the network.');
          }
        },
      },
    });
  }

}

interface IAssetFormField {
  amount: number;
  asset: IWalletAssetNative | IWalletAssetIssued;
}

interface IExchangeRate {
  denominator: string;
  numerator: string;
  amount: string;
}

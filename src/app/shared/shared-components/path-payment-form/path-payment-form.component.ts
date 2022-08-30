import { AfterViewInit, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, from, Observable, of, Subject, Subscription } from 'rxjs';
import { IWalletAssetModel, WalletsAccountsQuery, WalletsAssetsQuery, WalletsOffersQuery } from '~root/state';
import { debounceTime, delay, map, switchMap, take, takeUntil } from 'rxjs/operators';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { AccountResponse, ServerApi } from 'stellar-sdk';
import { WalletsAssetsService } from '~root/core/wallets/services/wallets-assets.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import { WalletsOffersService } from '~root/core/wallets/services/wallets-offers.service';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AssetSearcherComponent } from '~root/shared/asset-searcher/asset-searcher.component';
import BigNumber from 'bignumber.js';
import { XdrSignerComponent } from '~root/shared/modals/components/xdr-signer/xdr-signer.component';
import QrScanner from 'qr-scanner';
import { QrScanModalComponent } from '~root/shared/modals/components/qr-scan-modal/qr-scan-modal.component';
import { validPublicKeyValidator } from '~root/shared/forms-validators/valid-public-key.validator';

@Component({
  selector: 'app-path-payment-form',
  templateUrl: './path-payment-form.component.html',
  styleUrls: ['./path-payment-form.component.scss']
})
export class PathPaymentFormComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() mode: 'swap' | 'payment' = 'swap';
  @Input() cardTitle?: string;
  @Input() sendLabelText?: string;
  @Input() receiveLabelText?: string;
  @Input() confirmButtonText?: string;

  hasCamera = from(QrScanner.hasCamera());


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

  swapForm: UntypedFormGroup = new UntypedFormGroup({
    destination: new UntypedFormControl(''),
    memo: new UntypedFormControl(''),
    fromAsset: new UntypedFormGroup({
      amount: new UntypedFormControl(0, [
        Validators.required,
        Validators.min(0.0000001)
      ]),
      asset: new UntypedFormControl('', [Validators.required]),
    }, [Validators.required]),
    toAsset: new UntypedFormGroup({
      amount: new UntypedFormControl(0, [
        Validators.required,
        Validators.min(0.0000001)
      ]),
      asset: new UntypedFormControl('', [Validators.required]),
    }, [Validators.required]),
    pathType: new UntypedFormControl('send', [Validators.required]),
    slippageTolerance: new UntypedFormControl(0.005, [Validators.required]),
    path: new UntypedFormControl(undefined, [Validators.required]),
    exchangeRate: new UntypedFormControl(undefined, [Validators.required]),
  });

  get destination(): UntypedFormControl {
    return this.swapForm.controls.destination as UntypedFormControl;
  }

  get memo(): UntypedFormControl {
    return this.swapForm.controls.memo as UntypedFormControl;
  }

  get slippageTolerance(): UntypedFormControl {
    return this.swapForm.controls.slippageTolerance as UntypedFormControl;
  }

  get formPathType(): UntypedFormControl {
    return this.swapForm.controls.pathType as UntypedFormControl;
  }

  get pathTypeValue(): 'send' | 'receive' {
    return this.swapForm.controls.pathType.value;
  }

  get fromAssetAmount(): UntypedFormControl {
    return (this.swapForm.controls.fromAsset as UntypedFormGroup).controls.amount as UntypedFormControl;
  }

  get toAssetAmount(): UntypedFormControl {
    return (this.swapForm.controls.toAsset as UntypedFormGroup).controls.amount as UntypedFormControl;
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
    private readonly route: ActivatedRoute,
    private readonly translateService: TranslateService,
    private readonly cdr: ChangeDetectorRef,
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

  ngAfterViewInit(): void {
    this.route.queryParams
      .pipe(take(1))
      // We use a small delay to avoid getting the template error because at the point we are setting this
      .pipe(delay(10))
      .subscribe(params => {
        if (params.fromAssetId) {
          this.swapForm.get(['fromAsset', 'asset'])
            ?.patchValue(this.walletsAssetsQuery.getEntity(params.fromAssetId));
        }

        if (params.toAssetId) {
          this.swapForm.get(['toAsset', 'asset'])
            ?.patchValue(this.walletsAssetsQuery.getEntity(params.toAssetId));
        }
      });

    if (this.mode === 'payment') {
      this.swapForm.setControl('destination', new UntypedFormControl('', [Validators.required, validPublicKeyValidator]));
    }
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  async searchAsset(formValue: 'from' | 'to'): Promise<void> {
    const myAssets = await this.myAssets$.pipe(take(1)).toPromise();

    this.nzDrawerService.create<AssetSearcherComponent>({
      nzContent: AssetSearcherComponent,
      nzPlacement: 'bottom',
      nzTitle: this.translateService.instant('SWAP.SELECT_ASSET_TITLE'),
      nzHeight: '100%',
      nzCloseOnNavigation: true,
      nzWrapClassName: 'ios-safe-y',
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

    const fromAsset: IWalletAssetModel = this.swapForm.value.fromAsset.asset;
    const toAsset: IWalletAssetModel = this.swapForm.value.toAsset.asset;

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
      this.nzMessageService.error(this.translateService.instant('SWAP.NO_VALID_PATH'));
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

    const fromAsset: IWalletAssetModel = this.swapForm.value.fromAsset.asset;
    const fromAssetClass = fromAsset._id === 'native'
      ? this.stellarSdkService.SDK.Asset.native()
      : new this.stellarSdkService.SDK.Asset(fromAsset.assetCode, fromAsset.assetIssuer);

    const toAsset: IWalletAssetModel = this.swapForm.value.toAsset.asset;
    const toAssetClass = toAsset._id === 'native'
      ? this.stellarSdkService.SDK.Asset.native()
      : new this.stellarSdkService.SDK.Asset(toAsset.assetCode, toAsset.assetIssuer);

    let loadedAccount: AccountResponse;
    try {
      loadedAccount = await this.stellarSdkService.loadAccount(selectedAccount.publicKey);
    } catch (e) {
      this.nzMessageService.error(this.translateService.instant('ERROR_MESSAGES.CANT_FETCH_ACCOUNT_FROM_HORIZON'));
      return;
    }

    if (!updatedPath) {
      this.nzMessageService.error(this.translateService.instant('SWAP.NO_VALID_PATH'));
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
            && b.asset_issuer === toAsset.assetIssuer;
        });
    }

    if (!hasTrustline && this.mode === 'swap') {
      transactionBuilder.addOperation( this.stellarSdkService.SDK.Operation.changeTrust({ asset: toAssetClass }) );
    }

    const path = updatedPath.path.map(item =>
      item.asset_type === 'native'
        ? this.stellarSdkService.SDK.Asset.native()
        : new this.stellarSdkService.SDK.Asset(item.asset_code, item.asset_issuer)
    );

    const destination = this.mode === 'payment'
      ? this.destination.value
      : loadedAccount.accountId();

    if (this.pathTypeValue === 'send') {
      transactionBuilder.addOperation(
        this.stellarSdkService.SDK.Operation.pathPaymentStrictSend({
          destination,
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
          destination,
          destAsset: toAssetClass,
          sendAsset: fromAssetClass,
          destAmount: new BigNumber(this.toAssetAmount.value).toFixed(7),
          sendMax: this.maxToSend(this.fromAssetAmount.value),
          path
        })
      );
    } else {
      this.nzMessageService.error(this.translateService.instant('SWAP.INCORRECT_SELECTION'));
      return;
    }

    if (this.memo.value) {
      transactionBuilder
        .addMemo(this.stellarSdkService.SDK.Memo.text(this.memo.value));
    }

    const formattedXDR = transactionBuilder.build().toXDR();

    this.nzDrawerService.create<XdrSignerComponent>({
      nzContent: XdrSignerComponent,
      nzWrapClassName: 'drawer-full-w-320 ios-safe-y',
      nzCloseOnNavigation: true,
      nzTitle: this.translateService.instant('SWAP.SWAP_CONFIRM_TITLE'),
      nzContentParams: {
        xdr: formattedXDR,
        acceptHandler: async signedXdr => {
          try {
            await this.walletsOffersService.sendPathPayment(signedXdr);
            this.nzMessageService.success(this.translateService.instant('SUCCESS_MESSAGE.OPERATION_COMPLETED'));
          } catch (e: any) {
            this.nzMessageService.error(this.translateService.instant('ERROR_MESSAGES.NETWORK_REJECTED'));
          }
        },
      },
    });
  }

  scanPublicKey(): void {
    const drawerRef = this.nzDrawerService.create<QrScanModalComponent>({
      nzContent: QrScanModalComponent,
      nzPlacement: 'bottom',
      nzWrapClassName: 'drawer-full-w-320 ios-safe-y',
      nzTitle: this.translateService.instant('WALLET.SEND_PAYMENT.SCAN_PUBLIC_KEY_TITLE'),
      nzHeight: '100%',
      nzContentParams: {
        handleQrScanned: text => {
          this.swapForm.controls.destination.patchValue(text);
          drawerRef.close();
        }
      }
    });

    drawerRef.open();
  }

  scanMemoText(): void {
    const drawerRef = this.nzDrawerService.create<QrScanModalComponent>({
      nzContent: QrScanModalComponent,
      nzPlacement: 'bottom',
      nzWrapClassName: 'ios-safe-y',
      nzTitle: this.translateService.instant('WALLET.SEND_PAYMENT.SCAN_MEMO_TITLE'),
      nzHeight: '100%',
      nzContentParams: {
        handleQrScanned: text => {
          this.swapForm.controls.memo.patchValue(text);
          drawerRef.close();
          this.cdr.detectChanges();
        }
      }
    });

    drawerRef.open();
  }

}

interface IAssetFormField {
  amount: number;
  asset: IWalletAssetModel;
}

interface IExchangeRate {
  denominator: string;
  numerator: string;
  amount: string;
}

import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  Inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, from, Observable, Subject, Subscription } from 'rxjs';
import {
  IWalletAssetModel,
  IWalletsAccount,
  WalletsAccountsQuery,
  WalletsAssetsQuery,
  WalletsOperationsQuery
} from '~root/state';
import {
  delay,
  distinctUntilKeyChanged,
  map,
  shareReplay,
  switchMap,
  take,
  takeUntil,
  withLatestFrom
} from 'rxjs/operators';
import { ISelectOptions } from '~root/shared/forms-components/select/select.component';
import BigNumber from 'bignumber.js';
import { ENV, environment } from '~env';
import { WalletsAssetsService } from '~root/core/wallets/services/wallets-assets.service';
import { ModalsService } from '~root/shared/modals/modals.service';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import { WalletsAccountsService } from '~root/core/wallets/services/wallets-accounts.service';
import { ComponentCreatorService } from '~root/core/services/component-creator.service';
import { WalletsService } from '~root/core/wallets/services/wallets.service';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { QrScannerService } from '~root/mobile/services/qr-scanner.service';
import { Account, Asset, Operation, TransactionBuilder } from 'stellar-base';
import { AccountResponse, Claimant, Memo } from 'stellar-sdk';
import { XdrSignerComponent } from '~root/shared/modals/components/xdr-signer/xdr-signer.component';
import { ActivatedRoute } from '@angular/router';

import QrScanner from 'qr-scanner';
import { QrScanModalComponent } from '~root/shared/modals/components/qr-scan-modal/qr-scan-modal.component';
import { TranslateService } from '@ngx-translate/core';
import { validPublicKeyValidator } from '~root/shared/forms-validators/valid-public-key.validator';

@Component({
  selector: 'app-send-payment',
  templateUrl: './send-payment.component.html',
  styleUrls: ['./send-payment.component.scss']
})
export class SendPaymentComponent implements OnInit, AfterViewInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();
  onSubmitClick$: Subject<void> = new Subject<void>();
  loadingSubmitButton$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);


  isMobilePlatform = this.env.platform === 'mobile';
  hasCamera = from(QrScanner.hasCamera());

  sendingPayment$ = this.walletsOperationsQuery.sendingPayment$;
  showModal = false;

  form: UntypedFormGroup = new UntypedFormGroup({
    publicKey: new UntypedFormControl('', [
      Validators.required,
      validPublicKeyValidator
    ]),
    memo: new UntypedFormControl(''),
    assetCode: new UntypedFormControl('', [Validators.required]), // it's called asset code but it's actually the id
    amount: new UntypedFormControl('', [Validators.required])
  });

  selectedAccount$: Observable<IWalletsAccount> = this.walletsAccountsQuery.getSelectedAccount$;

  heldAssets$: Observable<IWalletAssetModel[]> = this.selectedAccount$
    .pipe(switchMap(selectedAccount => {
      const assetsIds = !!selectedAccount.accountRecord
        ? this.walletsAssetsService.filterBalancesLines(selectedAccount.accountRecord.balances).map(balanceLine => {
          return this.walletsAssetsService.formatBalanceLineId(balanceLine);
        })
        : [];

      return this.walletsAssetsQuery.getAssetsById(assetsIds);
    }));

  selectOptions$: Observable<ISelectOptions[]> = this.heldAssets$
    .pipe(map(assets =>
      assets.map(asset => ({
        name: asset.assetCode,
        value: asset._id
      }))
    ));

  selectedAsset$ = this.form.controls.assetCode.valueChanges
    .pipe(shareReplay(1))
    .pipe(withLatestFrom(this.heldAssets$))
    .pipe(map(([assetId, heldAssets]) => {
      return heldAssets.find(({ _id }) => assetId === _id);
    }));

  availableFunds$ = this.selectedAsset$
    .pipe(withLatestFrom(this.selectedAccount$))
    .pipe(map(([selectedAsset, selectedAccount]) => {
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
    }));

  constructor(
    @Inject(ENV)
    private readonly env: typeof environment,
    private readonly walletsAssetsService: WalletsAssetsService,
    private readonly walletsAssetsQuery: WalletsAssetsQuery,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly modalsService: ModalsService,
    private readonly stellarSdkService: StellarSdkService,
    private readonly walletsOperationsQuery: WalletsOperationsQuery,
    private readonly walletsAccountsService: WalletsAccountsService,
    private readonly componentCreatorService: ComponentCreatorService,
    private readonly walletsService: WalletsService,
    private readonly nzDrawerService: NzDrawerService,
    private readonly nzMessageService: NzMessageService,
    private readonly nzModalService: NzModalService,
    private readonly qrScannerService: QrScannerService,
    private readonly route: ActivatedRoute,
    private readonly cdr: ChangeDetectorRef,
    private readonly translateService: TranslateService,
  ) { }

  resetFormWhenSourceAccountChangesSubscription = this.selectedAccount$
    .pipe(distinctUntilKeyChanged('_id'))
    .pipe(takeUntil(this.componentDestroyed$))
    .subscribe(() => {
      this.form.reset();
    });

  onSubmitSubscription: Subscription = this.onSubmitClick$
    .asObservable()
    .pipe(takeUntil(this.componentDestroyed$))
    .subscribe(async _ => {
      this.loadingSubmitButton$.next(true);
      await this.onSubmit();
      this.loadingSubmitButton$.next(false);
    });

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.route.queryParams
      .pipe(take(1))
      .pipe(delay(10))
      .subscribe(params => {
        if (params.assetId) {
          this.form.controls.assetCode.setValue(params.assetId);
        } else {
          this.form.controls.assetCode.setValue('native');
        }
      });
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  async onSubmit(): Promise<void> {
    const [
      selectedAsset,
      selectedAccount,
    ] = await Promise.all([
      this.selectedAsset$.pipe(take(1)).toPromise(),
      this.selectedAccount$.pipe(take(1)).toPromise(),
    ]);

    if (!selectedAsset || !selectedAccount) {
      return;
    }

    const loadedAccount = await this.stellarSdkService.loadAccount(selectedAccount.publicKey);

    const targetAccount = new Account(loadedAccount.accountId(), loadedAccount.sequence);

    const transaction = new TransactionBuilder(targetAccount, {
      fee: this.stellarSdkService.fee,
      networkPassphrase: this.stellarSdkService.networkPassphrase,
    }).setTimeout(this.stellarSdkService.defaultTimeout);

    let destinationLoadedAccount: AccountResponse;
    try {
      destinationLoadedAccount = await this.stellarSdkService.loadAccount(this.form.value.publicKey);

      if (selectedAsset._id === 'native') {
        transaction.addOperation(
          Operation.payment({
            asset: selectedAsset._id === 'native'
              ? Asset.native()
              : new Asset(selectedAsset.assetCode, selectedAsset.assetIssuer),
            destination: this.form.value.publicKey,
            amount: new BigNumber(this.form.value.amount).toFixed(7),
          })
        );
      } else {
        const hasTrustline = destinationLoadedAccount.balances.find(b => {
          if (
            b.asset_type !== 'credit_alphanum4' &&
            b.asset_type !== 'credit_alphanum12'
          ) {
            return false;
          }

          return (
            b.asset_code === selectedAsset.assetCode &&
            b.asset_issuer === selectedAsset.assetIssuer
          );
        });

        if (hasTrustline) {
          transaction.addOperation(
            Operation.payment({
              asset: new Asset(selectedAsset.assetCode, selectedAsset.assetIssuer),
              destination: this.form.value.publicKey,
              amount: new BigNumber(this.form.value.amount).toFixed(7),
            })
          );
        } else {
          const modalResult$ = new Subject<boolean>();
          this.nzModalService.confirm({
            nzContent: this.translateService.instant('WALLET.SEND_PAYMENT.CONFIRM_CLAIMABLE_BALANCE'),
            nzOnOk: () => modalResult$.next(true),
            nzOnCancel: () => modalResult$.next(false),
            nzClosable: false,
            nzCentered: true
          });

          if (await modalResult$.pipe(take(1)).toPromise()) {
            transaction.addOperation(
              Operation.createClaimableBalance({
                asset: new Asset(selectedAsset.assetCode, selectedAsset.assetIssuer),
                amount: new BigNumber(this.form.value.amount).toFixed(7),
                claimants: [new Claimant(this.form.value.publicKey), new Claimant(loadedAccount.account_id)],
              })
            );
          } else {
            return;
          }
        }
      }

    } catch (e: any) {
      if (selectedAsset._id !== 'native') {
        this.nzMessageService.error(this.translateService.instant('WALLET.SEND_PAYMENT.CUSTOM_ASSET_TO_NON_TRUSTED'), {
          nzDuration: 3000,
        });
        return;
      }

      const modalResult$ = new Subject<boolean>();
      this.nzModalService.confirm({
        nzContent: this.translateService.instant('WALLET.SEND_PAYMENT.CONFIRM_CREATE_ACCOUNT'),
        nzOnOk: () => modalResult$.next(true),
        nzOnCancel: () => modalResult$.next(false),
        nzClosable: false,
        nzCentered: true
      });

      if (await modalResult$.pipe(take(1)).toPromise()) {
        transaction.addOperation(
          Operation.createAccount({
            destination: this.form.value.publicKey,
            startingBalance: new BigNumber(this.form.value.amount).toFixed(7),
          })
        );
      } else {
        return;
      }
    }

    if (!!this.form.value.memo) {
      transaction.addMemo(new Memo('text', this.form.value.memo));
    }

    const formattedXDR = transaction
      .build()
      .toXDR();

    const drawerRef = this.nzDrawerService.create<XdrSignerComponent>({
      nzContent: XdrSignerComponent,
      nzContentParams: {
        xdr: formattedXDR,
        acceptHandler: signedXdr => {
          this.walletsService.sendPayment(signedXdr)
            .then(() => {
              this.nzMessageService.success(this.translateService.instant('WALLET.SEND_PAYMENT.PAYMENT_SENT_MESSAGE'));
              this.form.reset();
            })
            .catch(err => {
              console.error(err);

              this.nzModalService.error({
                nzTitle: 'Oh oh!',
                nzContent: this.translateService.instant('ERROR_MESSAGES.NETWORK_REJECTED'),
              });
            });
        }
      },
      nzTitle: this.translateService.instant('WALLET.SEND_PAYMENT.PAYMENT_CONFIRMATION_TITLE'),
      nzWrapClassName: 'drawer-full-w-320 ios-safe-y',
    });

    drawerRef.open();

  }

  scanQr(): void {
    this.qrScannerService.scan()
      .then(value => {
        if (value.completed && value.text) {
          this.form.controls.publicKey.patchValue(value.text);
        }
      })
      .catch(console.error);
  }

  scanPublicKey(): void {
    const drawerRef = this.nzDrawerService.create<QrScanModalComponent>({
      nzContent: QrScanModalComponent,
      nzPlacement: 'bottom',
      nzWrapClassName: 'ios-safe-y',
      nzTitle: this.translateService.instant('WALLET.SEND_PAYMENT.SCAN_PUBLIC_KEY_TITLE'),
      nzHeight: '100%',
      nzContentParams: {
        handleQrScanned: text => {
          this.form.controls.publicKey.patchValue(text);
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
      nzTitle: this.translateService.instant('WALLET.SEND_PAYMENT.SCAN_MEMO_TITLE'),
      nzHeight: '100%',
      nzWrapClassName: 'ios-safe-y',
      nzContentParams: {
        handleQrScanned: text => {
          this.form.controls.memo.patchValue(text);
          drawerRef.close();
          this.cdr.detectChanges();
        }
      }
    });

    drawerRef.open();
  }

  async setMax(): Promise<void> {
    const availableFunds = await this.availableFunds$.pipe(take(1)).toPromise();
    this.form.controls.amount.setValue(availableFunds);
  }

}

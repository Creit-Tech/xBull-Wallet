import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  Inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, firstValueFrom, from, Observable, Subject, Subscription } from 'rxjs';
import {
  HorizonApisQuery,
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
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import { WalletsAccountsService } from '~root/core/wallets/services/wallets-accounts.service';
import { ComponentCreatorService } from '~root/core/services/component-creator.service';
import { WalletsService } from '~root/core/wallets/services/wallets.service';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { XdrSignerComponent } from '~root/shared/shared-modals/components/xdr-signer/xdr-signer.component';
import { ActivatedRoute } from '@angular/router';

import QrScanner from 'qr-scanner';
import { QrScanModalComponent } from '~root/shared/shared-modals/components/qr-scan-modal/qr-scan-modal.component';
import { TranslateService } from '@ngx-translate/core';
import { validPublicKeyValidator } from '~root/shared/forms-validators/valid-public-key.validator';
import {
  Account,
  Asset,
  Claimant,
  Horizon,
  Memo,
  Operation,
  StrKey,
  Transaction,
  TransactionBuilder
} from '@stellar/stellar-sdk';
import { PromptModalComponent } from '~root/shared/shared-modals/components/prompt-modal/prompt-modal.component';
import { SorobandomainsService } from '~root/core/services/sorobandomains/sorobandomains.service';
// @ts-ignore
import { Record } from '@creit-tech/sorobandomains-sdk';
import { validRecipientKeyValidator } from '~root/shared/forms-validators/valid-recipient.validator';

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
      validRecipientKeyValidator
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
    private readonly stellarSdkService: StellarSdkService,
    private readonly walletsOperationsQuery: WalletsOperationsQuery,
    private readonly walletsService: WalletsService,
    private readonly nzDrawerService: NzDrawerService,
    private readonly nzMessageService: NzMessageService,
    private readonly nzModalService: NzModalService,
    private readonly route: ActivatedRoute,
    private readonly cdr: ChangeDetectorRef,
    private readonly translateService: TranslateService,
    private readonly sorobandomainsService: SorobandomainsService,
    private readonly horizonApisQuery: HorizonApisQuery,
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
        this.getAndSetParams(params);
      });
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  getAndSetParams(params: any): void {
    if (params.assetId) {
      this.form.controls.assetCode.setValue(params.assetId);
    } else {
      this.form.controls.assetCode.setValue('native');
    }

    if (params.destination) {
      this.form.controls.publicKey.setValue(params.destination);
    }

    if (params.amount) {
      this.form.controls.amount.setValue(params.amount);
    }

    if (params.asset_code && params.asset_issuer) {
      const assetId = this.walletsAssetsService.assetIdFromAssetString(
        params.asset_code + ':' + params.asset_issuer
      );

      this.form.controls.assetCode.setValue(assetId);
    }

    if (params.memo) {
      this.form.controls.memo.setValue(params.memo);
    }
  }

  async sendPaymentToAccountXDR(params: {
    asset: IWalletAssetModel;
    account: IWalletsAccount;
    tx: TransactionBuilder;
  }): Promise<Transaction> {
    let destinationLoadedAccount: Horizon.AccountResponse;
    try {
      destinationLoadedAccount = await this.stellarSdkService.loadAccount(this.form.value.publicKey);

      if (params.asset._id === 'native') {
        params.tx.addOperation(
          Operation.payment({
            asset: params.asset._id === 'native'
              ? Asset.native()
              : new Asset(params.asset.assetCode, params.asset.assetIssuer),
            destination: this.form.value.publicKey,
            amount: new BigNumber(this.form.value.amount).toFixed(7),
          })
        );
      } else {
        const hasTrustline = destinationLoadedAccount.balances.find((b: any) => {
          if (b.asset_type !== 'credit_alphanum4' && b.asset_type !== 'credit_alphanum12') return false;
          else return (b.asset_code === params.asset.assetCode && b.asset_issuer === params.asset.assetIssuer);
        });

        if (hasTrustline || params.asset.assetIssuer === this.form.value.publicKey) {
          params.tx.addOperation(
            Operation.payment({
              asset: new Asset(params.asset.assetCode, params.asset.assetIssuer),
              destination: this.form.value.publicKey,
              amount: new BigNumber(this.form.value.amount).toFixed(7),
            })
          );
        } else {
          const modalResult$ = new Subject<boolean>();
          this.nzModalService.confirm({
            nzContent: this.translateService.instant('WALLET.SEND_PAYMENT.CONFIRM_CLAIMABLE_BALANCE'),
            nzOkText: 'Yes',
            nzOnOk: () => modalResult$.next(true),
            nzCancelText: 'No',
            nzOnCancel: () => modalResult$.next(false),
            nzClosable: false,
            nzCentered: true
          });

          if (await modalResult$.pipe(take(1)).toPromise()) {
            params.tx.addOperation(
              Operation.createClaimableBalance({
                asset: new Asset(params.asset.assetCode, params.asset.assetIssuer),
                amount: new BigNumber(this.form.value.amount).toFixed(7),
                claimants: [new Claimant(this.form.value.publicKey), new Claimant(params.account.publicKey)],
              })
            );
          } else {
            this.nzMessageService.info(this.translateService.instant('WALLET.SEND_PAYMENT.ALERT_SENDING_NO_TRUSTLINE'), {
              nzDuration: 5000,
            });
            params.tx.addOperation(
              Operation.payment({
                asset: new Asset(params.asset.assetCode, params.asset.assetIssuer),
                destination: this.form.value.publicKey,
                amount: new BigNumber(this.form.value.amount).toFixed(7),
              })
            );
          }
        }
      }

    } catch (e: any) {
      if (params.asset._id !== 'native') {
        throw new Error(this.translateService.instant('WALLET.SEND_PAYMENT.CUSTOM_ASSET_TO_NON_TRUSTED'));
      }

      const modalResult$ = new Subject<boolean>();
      this.nzModalService.confirm({
        nzContent: this.translateService.instant('WALLET.SEND_PAYMENT.CONFIRM_CREATE_ACCOUNT'),
        nzOnOk: () => modalResult$.next(true),
        nzOnCancel: () => modalResult$.next(false),
        nzClosable: false,
        nzCentered: true
      });

      if (await firstValueFrom(modalResult$)) {
        params.tx.addOperation(
          Operation.createAccount({
            destination: this.form.value.publicKey,
            startingBalance: new BigNumber(this.form.value.amount).toFixed(7),
          })
        );
      } else {
        throw new Error('Process cancelled.');
      }
    }
    return params.tx.build();
  }

  async sendToContractXDR(params: {
    asset: IWalletAssetModel;
    account: IWalletsAccount;
    tx: TransactionBuilder;
  }): Promise<Transaction> {
    const selectedHorizon = await firstValueFrom(this.horizonApisQuery.getSelectedHorizonApi$);
    const assetId = this.walletsAssetsService.sdkAssetFromAssetId(params.asset._id).contractId(selectedHorizon.networkPassphrase);
    const contract = new this.stellarSdkService.SDK.Contract(assetId);
    params.tx.addOperation(
      contract.call(
        'transfer',
        new this.stellarSdkService.SDK.Address(params.account.publicKey).toScVal(),
        new this.stellarSdkService.SDK.Address(this.form.value.publicKey).toScVal(),
        this.stellarSdkService.SDK.nativeToScVal(new BigNumber(this.form.value.amount).multipliedBy(10000000).toFixed(0), { type: 'i128' }),
      ),
    );

    return this.stellarSdkService.simOrRestore(params.tx.build());
  }

  async onSubmit(): Promise<void> {
    const [
      selectedAsset,
      selectedAccount,
    ] = await Promise.all([
      firstValueFrom(this.selectedAsset$),
      firstValueFrom(this.selectedAccount$),
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

    if (!!this.form.value.memo) {
      transaction.addMemo(new Memo('text', this.form.value.memo));
    }

    let updatedTx: Transaction;
    try {
      updatedTx = await (StrKey.isValidContract(this.form.value.publicKey)
        ? this.sendToContractXDR({ account: selectedAccount, asset: selectedAsset, tx: transaction })
        : this.sendPaymentToAccountXDR({ account: selectedAccount, asset: selectedAsset, tx: transaction }));
    } catch (e: any) {
      this.nzMessageService.error(e.message, {
        nzDuration: 3000,
      });
      return
    }

    const drawerRef = this.nzDrawerService.create<XdrSignerComponent>({
      nzContent: XdrSignerComponent,
      nzContentParams: {
        xdr: updatedTx.toXDR(),
        signingResultsHandler: result => {
          this.walletsService.sendPayment(result.transaction as Transaction)
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
        },
      },
      nzTitle: this.translateService.instant('WALLET.SEND_PAYMENT.PAYMENT_CONFIRMATION_TITLE'),
      nzWrapClassName: 'drawer-full-w-340 ios-safe-y',
    });

    drawerRef.open();

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

  async searchDomain(): Promise<void> {
    this.nzDrawerService.create<PromptModalComponent>({
      nzContent: PromptModalComponent,
      nzPlacement: 'bottom',
      nzTitle: '',
      nzHeight: 'auto',
      nzWrapClassName: 'ios-safe-y',
      nzContentParams: {
        title: 'Search a Soroban Domain',
        description: 'Fetch the public key by consulting the domain',
        handleConfirmEvent: async (value: string) => {
          if (!value) {
            return;
          }

          const messageId: string = this.nzMessageService.loading('Searching...').messageId;

          try {
            const record: Record = await this.sorobandomainsService.sdk.searchDomain(
              this.sorobandomainsService.domainParser(value)
            );

            this.form.controls.publicKey.patchValue(record.value.address);

            this.nzMessageService.remove(messageId);
          } catch (e: any) {
            this.nzMessageService.remove(messageId);
            this.nzMessageService.error(e.message || 'Domain invalid or doesn\'t exist');
          }
        }
      },
    });
  }

}

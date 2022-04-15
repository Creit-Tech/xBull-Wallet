import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, from, merge, Observable, Subject, Subscription } from 'rxjs';
import {
  IWalletAssetModel,
  IWalletsAccount,
  WalletsAccountsQuery,
  WalletsAssetsQuery,
  WalletsOperationsQuery
} from '~root/state';
import { delay, map, shareReplay, switchMap, take, takeUntil, tap, withLatestFrom } from 'rxjs/operators';
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
import { Memo } from 'stellar-sdk';
import { XdrSignerComponent } from '~root/shared/modals/components/xdr-signer/xdr-signer.component';
import { ActivatedRoute } from '@angular/router';

import QrScanner from 'qr-scanner';
import { QrScanModalComponent } from '~root/shared/modals/components/qr-scan-modal/qr-scan-modal.component';

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

  form: FormGroup = new FormGroup({
    publicKey: new FormControl('', [
      Validators.required,
      Validators.minLength(56),
      Validators.maxLength(56),
    ]),
    memo: new FormControl(''),
    assetCode: new FormControl('', [Validators.required]), // it's called asset code but it's actually the id
    amount: new FormControl('', [Validators.required])
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
    .pipe(take(1))
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
  ) { }

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

    const loadedAccount = await this.stellarSdkService.Server.loadAccount(selectedAccount.publicKey);

    const targetAccount = new Account(loadedAccount.accountId(), loadedAccount.sequence);

    const transaction = new TransactionBuilder(targetAccount, {
      fee: this.stellarSdkService.fee,
      networkPassphrase: this.stellarSdkService.networkPassphrase,
    }).setTimeout(this.stellarSdkService.defaultTimeout);

    try {
      await this.stellarSdkService.Server.loadAccount(this.form.value.publicKey);
      transaction.addOperation(
        Operation.payment({
          asset: selectedAsset._id === 'native'
            ? Asset.native()
            : new Asset(selectedAsset.assetCode, selectedAsset.assetIssuer),
          destination: this.form.value.publicKey,
          amount: new BigNumber(this.form.value.amount).toFixed(7),
        })
      );
    } catch (e: any) {
      if (selectedAsset._id !== 'native') {
        this.nzMessageService.error(`We ca not send custom assets to an account that has not been created yet.`, {
          nzDuration: 3000,
        });
        return;
      }
      transaction.addOperation(
        Operation.createAccount({
          destination: this.form.value.publicKey,
          startingBalance: new BigNumber(this.form.value.amount).toFixed(7),
        })
      );
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
              this.nzMessageService.success('Payment sent correctly');
              this.form.reset();
            })
            .catch(err => {
              console.error(err);

              this.nzModalService.error({
                nzTitle: 'Oh oh!',
                nzContent: `The network rejected the transaction, please try again or contact support`
              });
            });
        }
      },
      nzTitle: 'Payment confirmation',
      nzWrapClassName: 'drawer-full-w-320',
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
      nzTitle: 'Scan Public key',
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
      nzTitle: 'Scan Public key',
      nzHeight: '100%',
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

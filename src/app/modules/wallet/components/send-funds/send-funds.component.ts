import { AfterViewInit, Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { IWalletAsset, IWalletsAccount, WalletsAccountsQuery, WalletsAssetsQuery, WalletsOperationsQuery } from '~root/state';
import {filter, map, pluck, shareReplay, switchMap, take, takeUntil, tap, withLatestFrom} from 'rxjs/operators';
import { WalletsAssetsService } from '~root/core/wallets/services/wallets-assets.service';
import { ISelectOptions } from '~root/shared/forms-components/select/select.component';
import { ModalsService } from '~root/shared/modals/modals.service';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import { Account, Asset, TransactionBuilder, Operation } from 'stellar-base';
import BigNumber from 'bignumber.js';
import { merge, Subject } from 'rxjs';
import { Memo } from 'stellar-sdk';
import { WalletsAccountsService } from '~root/core/wallets/services/wallets-accounts.service';
import { ComponentCreatorService } from '~root/core/services/component-creator.service';
import { ToastrService } from '~root/shared/toastr/toastr.service';
import { WalletsService } from '~root/core/wallets/services/wallets.service';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import { XdrSignerComponent } from '~root/shared/modals/components/xdr-signer/xdr-signer.component';
import {NzMessageService} from "ng-zorro-antd/message";
import {NzModalService} from "ng-zorro-antd/modal";
import {QrScannerService} from "~root/mobile/services/qr-scanner.service";

@Component({
  selector: 'app-send-funds',
  templateUrl: './send-funds.component.html',
  styleUrls: ['./send-funds.component.scss']
})
export class SendFundsComponent implements OnInit, AfterViewInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();

  @Output() paymentSent: EventEmitter<void> = new EventEmitter<void>();
  @Output() closed: EventEmitter<void> = new EventEmitter<void>();

  sendingPayment$ = this.walletsOperationsQuery.sendingPayment$;
  showModal = false;

  form: FormGroupTyped<ISendFundsForm> = new FormGroup({
    publicKey: new FormControl('', [
      Validators.required,
      Validators.minLength(56),
      Validators.maxLength(56),
    ]),
    memo: new FormControl(''),
    assetCode: new FormControl('', [Validators.required]),
    amount: new FormControl('', [Validators.required])
  }) as FormGroupTyped<ISendFundsForm>;

  selectedAccount$: Observable<IWalletsAccount> = this.walletsAccountsQuery.getSelectedAccount$;

  heldAssets$: Observable<IWalletAsset[]> = this.selectedAccount$
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
  ) { }

  ngOnInit(): void {
  }

  async ngAfterViewInit(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100)); // hack because for some reason Angular is not working as we want
    this.showModal = true;
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
            : new Asset(selectedAsset.assetCode, (selectedAsset as IWalletAsset<'issued'>).assetIssuer),
          destination: this.form.value.publicKey,
          amount: new BigNumber(this.form.value.amount).toFixed(7),
        })
      );
    } catch (e) {
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
        xdr: formattedXDR
      },
      nzPlacement: 'bottom',
      nzHeight: '88%',
      nzTitle: ''
    });

    drawerRef.open();

    await drawerRef.afterOpen.pipe(take(1)).toPromise();

    const componentRef = drawerRef.getContentComponent();

    if (!componentRef) {
      return;
    }

    componentRef.accept
      .asObservable()
      .pipe(take(1))
      .pipe(takeUntil(
        merge(
          this.componentDestroyed$,
          drawerRef.afterClose
        )
      ))
      .subscribe((signedXdr) => {
        drawerRef.close();
        this.walletsService.sendPayment(signedXdr)
          .then(() => {
            this.nzMessageService.success('Payment sent correctly');
            this.paymentSent.emit();
          })
          .catch(err => {
            console.error(err);

            this.nzModalService.error({
              nzTitle: 'Oh oh!',
              nzContent: `We were not able to send the payment, please try again or contact support`
            });
          });
      });

  }

  async onClose(): Promise<void> {
    this.showModal = false;
    await new Promise(resolve => setTimeout(resolve, 300)); // This is to wait until the animation is done
    this.closed.emit();
  }

  qr() {
    this.qrScannerService.scan()
      .then(console.log)
      .catch(console.error);
  }

}

export interface ISendFundsForm {
  publicKey: string;
  memo: string;
  assetCode: string;
  amount: string;
}

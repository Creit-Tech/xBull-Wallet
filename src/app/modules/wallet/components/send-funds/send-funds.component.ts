import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { IWalletAsset, IWalletsAccount, WalletsAccountsQuery, WalletsAssetsQuery, WalletsOperationsQuery } from '~root/core/wallets/state';
import { filter, map, shareReplay, switchMap, take, takeUntil, withLatestFrom } from 'rxjs/operators';
import { WalletsAssetsService } from '~root/core/wallets/services/wallets-assets.service';
import { ISelectOptions } from '~root/shared/forms-components/select/select.component';
import { ModalsService } from '~root/shared/modals/modals.service';
import { SignRequestComponent } from '~root/shared/modals/components/sign-request/sign-request.component';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import { Account, Asset, TransactionBuilder, Operation } from 'stellar-base';
import BigNumber from 'bignumber.js';
import { merge, Subject } from 'rxjs';
import { WalletsOperationsService } from '~root/core/wallets/services/wallets-operations.service';
import { Memo } from 'stellar-sdk';
import { WalletsAccountsService } from '~root/core/wallets/services/wallets-accounts.service';

@Component({
  selector: 'app-send-funds',
  templateUrl: './send-funds.component.html',
  styleUrls: ['./send-funds.component.scss']
})
export class SendFundsComponent implements OnInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();

  @Output() paymentSent: EventEmitter<void> = new EventEmitter<void>();

  sendingPayment$ = this.walletsOperationsQuery.sendingPayment$;

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
        ? selectedAccount.accountRecord.balances.map(balanceLine => {
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
    .pipe(filter(selectedAsset => !!selectedAsset))
    .pipe(withLatestFrom(this.selectedAccount$))
    .pipe(map(([selectedAsset, selectedAccount]) => {
      if (!selectedAsset || !selectedAccount.accountRecord) {
        console.warn('Balance or Account record is undefined');
        return new BigNumber(0).toNumber();
      }

      return this.stellarSdkService
        .calculateAvailableBalance(selectedAccount.accountRecord, selectedAsset.assetCode)
        .toNumber();
    }));

  constructor(
    private readonly walletsAssetsService: WalletsAssetsService,
    private readonly walletsAssetsQuery: WalletsAssetsQuery,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly modalsService: ModalsService,
    private readonly stellarSdkService: StellarSdkService,
    private readonly walletsOperationsService: WalletsOperationsService,
    private readonly walletsOperationsQuery: WalletsOperationsQuery,
    private readonly walletsAccountsService: WalletsAccountsService,
  ) { }

  ngOnInit(): void {
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

    const loadedAccount = await this.stellarSdkService.Server.loadAccount(selectedAccount._id);

    const targetAccount = new Account(loadedAccount.accountId(), loadedAccount.sequence);

    const transaction = new TransactionBuilder(targetAccount, {
      fee: this.stellarSdkService.fee,
      networkPassphrase: this.stellarSdkService.networkPassphrase,
    })
      .addOperation(
        Operation.payment({
          asset: selectedAsset._id === 'native'
            ? Asset.native()
            : new Asset(selectedAsset.assetCode, (selectedAsset as IWalletAsset<'issued'>).assetIssuer),
          destination: this.form.value.publicKey,
          amount: new BigNumber(this.form.value.amount).toFixed(7),
        })
      )
      .setTimeout(this.stellarSdkService.defaultTimeout);

    if (!!this.form.value.memo) {
      transaction.addMemo(new Memo('text', this.form.value.memo));
    }

    const formattedXDR = transaction
      .build()
      .toXDR();

    const modalData = await this.modalsService.open<SignRequestComponent>({ component: SignRequestComponent });

    modalData.componentRef.instance.xdr = formattedXDR;

    modalData.componentRef.instance.accepted
      .asObservable()
      .pipe(take(1))
      .pipe(switchMap((signedXdr) =>
        this.walletsOperationsService.sendPayment(signedXdr)
      ))
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(() => {
        modalData.modalContainer.instance.onClose();
        this.paymentSent.emit();
      });

    modalData.componentRef.instance.deny
      .asObservable()
      .pipe(take(1))
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(() => {
        modalData.modalContainer.instance.onClose();
      });

    this.sendingPayment$
      .pipe(takeUntil(
        merge(
          modalData.modalContainer.instance.closeModal$,
          modalData.componentRef.instance.deny,
          this.componentDestroyed$
        )
      ))
      .subscribe((removingAsset: boolean) => modalData.modalContainer.instance.loading = removingAsset);
  }

}

export interface ISendFundsForm {
  publicKey: string;
  memo: string;
  assetCode: string;
  amount: string;
}

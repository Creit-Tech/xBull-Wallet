import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import {
  IWalletAsset,
  IWalletsAccount,
  WalletsAccountsQuery,
  WalletsAssetsQuery,
  WalletsOffersQuery,
  WalletsOperationsQuery,
} from '~root/state';
import { filter, map, switchMap, take, takeUntil } from 'rxjs/operators';
import { ISelectOptions } from '~root/shared/forms-components/select/select.component';
import { WalletsAssetsService } from '~root/core/wallets/services/wallets-assets.service';
import BigNumber from 'bignumber.js';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import { ModalsService } from '~root/shared/modals/modals.service';
import { ToastrService } from '~root/shared/toastr/toastr.service';
import { TransactionBuilder, Operation, Account } from 'stellar-sdk';
import { SignRequestComponent } from '~root/shared/modals/components/sign-request/sign-request.component';
import { Subject } from 'rxjs';
import { WalletsOffersService } from '~root/core/wallets/services/wallets-offers.service';

@Component({
  selector: 'app-offer',
  templateUrl: './offer.component.html',
  styleUrls: ['./offer.component.scss']
})
export class OfferComponent implements OnInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();

  form: FormGroupTyped<IOfferForm> = new FormGroup({
    fromAsset: new FormControl('', [Validators.required]),
    fromValue: new FormControl('', [Validators.required, Validators.min(0.0000001)]),
    toAsset: new FormControl('', [Validators.required]),
    toValue: new FormControl('', [Validators.required, Validators.min(0.0000001)]),
  }) as FormGroupTyped<IOfferForm>;

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
    .pipe(take(1))
    .pipe(map(assets =>
      assets.map(asset => ({
        name: asset.assetCode,
        value: asset._id
      }))
    ));

  currentRateText$: Observable<string> = this.form.valueChanges
    .pipe(filter(() => this.form.valid))
    .pipe(map(values => {
      const aCode = this.walletsAssetsService.sdkAssetFromAssetId(values.toAsset).code;
      const bCode = this.walletsAssetsService.sdkAssetFromAssetId(values.fromAsset).code;
      const bRate = new BigNumber(values.fromValue || 0).dividedBy(new BigNumber(values.toValue || 0));

      return `1 ${aCode} = ${bRate.toFixed(7)} ${bCode}`;
    }));

  sendingOffer$ = this.walletsOffersQuery.sendingOffer$;

  constructor(
    private readonly walletsAssetsService: WalletsAssetsService,
    private readonly walletsAssetsQuery: WalletsAssetsQuery,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly modalsService: ModalsService,
    private readonly walletsOffersService: WalletsOffersService,
    private readonly walletsOffersQuery: WalletsOffersQuery,
    private readonly toastrService: ToastrService,
    private readonly stellarSdkService: StellarSdkService,
  ) { }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  async onConfirm(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    const selectedAccount = await this.selectedAccount$.pipe(take(1)).toPromise();
    const loadedAccount = await this.stellarSdkService.Server.loadAccount(selectedAccount._id);

    const transaction = new TransactionBuilder(new Account(loadedAccount.accountId(), loadedAccount.sequence), {
      fee: this.stellarSdkService.fee,
      networkPassphrase: this.stellarSdkService.networkPassphrase,
    })
      .addOperation(Operation.manageSellOffer({
        amount: this.form.value.fromValue,
        buying: this.walletsAssetsService.sdkAssetFromAssetId(this.form.value.toAsset),
        selling: this.walletsAssetsService.sdkAssetFromAssetId(this.form.value.fromAsset),
        price: new BigNumber(this.form.value.toValue).dividedBy(new BigNumber(this.form.value.fromValue)),
      }))
      .setTimeout(this.stellarSdkService.defaultTimeout);

    const formattedXDR = transaction
      .build()
      .toXDR();

    const modalData = await this.modalsService.open<SignRequestComponent>({ component: SignRequestComponent });

    modalData.componentRef.instance.xdr = formattedXDR;

    modalData.componentRef.instance.accepted
      .asObservable()
      .pipe(take(1))
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe((signedXdr) => {
        this.sendOffer(signedXdr);
        modalData.modalContainer.instance.onClose();
      });

    modalData.componentRef.instance.deny
      .asObservable()
      .pipe(take(1))
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(() => {
        modalData.modalContainer.instance.onClose();
      });
  }

  async sendOffer(signedXdr: string): Promise<void> {
    try {
      await this.walletsOffersService.sendManageSellOffer(signedXdr);
      this.toastrService.open({
        message: 'We placed the offer correctly',
        status: 'success',
        title: 'Operation completed'
      });
    } catch (e) {
      this.toastrService.open({
        message: 'We were not able to complete the operation.',
        status: 'error',
        title: 'Oops!'
      });
    }
  }

}

export interface IOfferForm {
  fromAsset: string;
  fromValue: string;
  toAsset: string;
  toValue: string;
}

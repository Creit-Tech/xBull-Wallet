import { Component, OnInit } from '@angular/core';
import { IWalletAsset, IWalletsAccount, WalletsAccountsQuery, WalletsAssetsQuery } from '~root/core/wallets/state';
import { map, startWith, switchMap, take, takeUntil } from 'rxjs/operators';
import { ISelectOptions } from '~root/shared/forms-components/select/select.component';
import { WalletsAssetsService } from '~root/core/wallets/services/wallets-assets.service';
import { Subject } from 'rxjs';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import BigNumber from 'bignumber.js';
import { TransactionBuilder, Account, Operation, Asset } from 'stellar-sdk';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import { SignRequestComponent } from '~root/shared/modals/components/sign-request/sign-request.component';
import { ToastrService } from '~root/shared/toastr/toastr.service';
import { ModalsService } from '~root/shared/modals/modals.service';
import { TradeService } from '~root/modules/trade/services/trade.service';
import { TradeQuery } from '~root/modules/trade/state';

@Component({
  selector: 'app-limit',
  templateUrl: './limit.component.html',
  styleUrls: ['./limit.component.scss']
})
export class LimitComponent implements OnInit {
  componentDestroyed$: Subject<boolean> = new Subject<boolean>();

  form: FormGroupTyped<ILimitForm> = new FormGroup({
    assetToPayWith: new FormControl('', [Validators.required]),
    assetToBuy: new FormControl('', [Validators.required]),
    amount: new FormControl('', [Validators.required, Validators.min(0.0000001)]),
    price: new FormControl('', [Validators.required, Validators.min(0.0000001)]),
  }) as FormGroupTyped<ILimitForm>;

  maxAmountToPay$: Observable<BigNumber> = this.form.valueChanges
    .pipe(startWith(this.form.value))
    .pipe(map(value => {
      const amount = new BigNumber(value.amount);
      const price = new BigNumber(value.price);

      if (amount.isNaN() || price.isNaN()) {
        return new BigNumber(0);
      }

      return amount.multipliedBy(price);
    }));

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

  sendingPathPaymentStrictReceive$ = this.tradeQuery.sendingPathPaymentStrictReceive$;

  constructor(
    private readonly walletsAssetsService: WalletsAssetsService,
    private readonly walletsAssetsQuery: WalletsAssetsQuery,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly stellarSdkService: StellarSdkService,
    private readonly modalsService: ModalsService,
    private readonly toastrService: ToastrService,
    private readonly tradeService: TradeService,
    private readonly tradeQuery: TradeQuery,
  ) { }

  ngOnInit(): void {
  }

  async onConfirm(): Promise<void> {
    const selectedAccount = await this.selectedAccount$.pipe(take(1)).toPromise();

    const updatedPathPromise = this.stellarSdkService.Server.strictReceivePaths(
      [this.walletsAssetsService.sdkAssetFromAssetId(this.form.value.assetToPayWith)],
      this.walletsAssetsService.sdkAssetFromAssetId(this.form.value.assetToBuy),
      this.form.value.amount,
    ).call();
    const loadedAccountPromise = this.stellarSdkService.Server.loadAccount(selectedAccount._id);

    const [
      updatedPath,
      loadedAccount
    ] = await Promise.all([
      updatedPathPromise,
      loadedAccountPromise,
    ]);

    const cheapestPath = updatedPath.records.shift();

    const amount = new BigNumber(this.form.value.amount);
    const price = new BigNumber(this.form.value.price);

    if (!cheapestPath || amount.isNaN() || price.isNaN()) {
      // TODO: add an error alert
      return ;
    }

    const transaction = new TransactionBuilder(new Account(loadedAccount.accountId(), loadedAccount.sequence), {
      fee: this.stellarSdkService.fee,
      networkPassphrase: this.stellarSdkService.networkPassphrase,
    })
      .addOperation(Operation.pathPaymentStrictReceive({
        destination: loadedAccount.accountId(),
        destAsset: cheapestPath.destination_asset_type === 'native'
          ? Asset.native()
          : new Asset(cheapestPath.destination_asset_code, cheapestPath.destination_asset_issuer),
        sendAsset: cheapestPath.source_asset_type === 'native'
          ? Asset.native()
          : new Asset(cheapestPath.source_asset_code, cheapestPath.source_asset_issuer),
        destAmount: cheapestPath.destination_amount,
        path: cheapestPath.path
          .map(item =>
            item.asset_type === 'native'
              ? Asset.native()
              : new Asset(item.asset_code, item.asset_issuer)
          ),
        sendMax: amount.multipliedBy(price).toFixed(7),
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
        this.sendTradeOrder(signedXdr);
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

  async sendTradeOrder(signedXdr: string): Promise<void> {
    try {
      await this.tradeService.sendPathPaymentStrictReceive(signedXdr);
      this.toastrService.open({
        message: 'The asset trade were successful',
        status: 'success',
        title: 'Operation completed'
      });
    } catch (e) {
      this.toastrService.open({
        message: 'We were not able to complete the trade.',
        status: 'error',
        title: 'Oops!'
      });
    }
  }

}

export interface ILimitForm {
  assetToPayWith: string;
  assetToBuy: string;
  amount: string;
  price: string;
}

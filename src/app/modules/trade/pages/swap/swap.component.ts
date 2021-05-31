import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { IWalletAsset, IWalletsAccount, WalletsAccountsQuery, WalletsAssetsQuery } from '~root/core/wallets/state';
import { debounceTime, filter, map, pluck, switchMap, take, takeUntil } from 'rxjs/operators';
import { ISelectOptions } from '~root/shared/forms-components/select/select.component';
import { WalletsAssetsService } from '~root/core/wallets/services/wallets-assets.service';
import BigNumber from 'bignumber.js';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import { TransactionBuilder, Account, Operation, Asset } from 'stellar-sdk';
import { SignRequestComponent } from '~root/shared/modals/components/sign-request/sign-request.component';
import { ModalsService } from '~root/shared/modals/modals.service';
import { Subject } from 'rxjs';
import { TradeService } from '~root/modules/trade/services/trade.service';
import { TradeQuery } from '~root/modules/trade/state';
import { ToastrService } from '~root/shared/toastr/toastr.service';

@Component({
  selector: 'app-swap',
  templateUrl: './swap.component.html',
  styleUrls: ['./swap.component.scss']
})
export class SwapComponent implements OnInit, OnDestroy {
  componentDestroyed$: Subject<boolean> = new Subject<boolean>();

  form: FormGroupTyped<ISwapForm> = new FormGroup({
    fromAsset: new FormControl('', [Validators.required]),
    toAsset: new FormControl('', [Validators.required]),
    amountToSwap: new FormControl('', [Validators.required, Validators.min(0)]),
  }) as FormGroupTyped<ISwapForm>;

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

  pathPaymentRecords$ = this.form.valueChanges
    .pipe(filter<ISwapForm>(formValue => {
      return this.form.valid;
      // return Object.values(formValue).every(assetId => assetId !== '')
      //   && new BigNumber(formValue.amountToSwap).isGreaterThan(0);
    }))
    .pipe(debounceTime(1000))
    .pipe(switchMap(({fromAsset, toAsset, amountToSwap}) => {
      return this.stellarSdkService.Server.strictSendPaths(
        this.walletsAssetsService.sdkAssetFromAssetId(fromAsset),
        amountToSwap,
        [this.walletsAssetsService.sdkAssetFromAssetId(toAsset)]
      ).call().catch(error => {
        console.error(error);
        // TODO: Add an error handler and show a toast with the error message
        return { records: [] };
      });
    }))
    .pipe(pluck('records'));

  shouldReceive$: Observable<BigNumber> = this.pathPaymentRecords$
    .pipe(map(records => records[0]))
    .pipe(map(pathRecord => {
      if (!pathRecord) {
        return new BigNumber(0);
      } else {
        return new BigNumber(pathRecord.destination_amount);
      }
    }));

  sendingPathPaymentStrictSend$ = this.tradeQuery.sendingPathPaymentStrictSend$;

  constructor(
    private readonly walletsAssetsService: WalletsAssetsService,
    private readonly walletsAssetsQuery: WalletsAssetsQuery,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly stellarSdkService: StellarSdkService,
    private readonly modalsService: ModalsService,
    private readonly tradeService: TradeService,
    private readonly tradeQuery: TradeQuery,
    private readonly toastrService: ToastrService,
  ) { }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  async onConfirm(): Promise<void> {
    const selectedAccount = await this.selectedAccount$.pipe(take(1)).toPromise();

    const updatedPathPromise = this.stellarSdkService.Server.strictSendPaths(
      this.walletsAssetsService.sdkAssetFromAssetId(this.form.value.fromAsset),
      this.form.value.amountToSwap,
      [this.walletsAssetsService.sdkAssetFromAssetId(this.form.value.toAsset)]
    ).call();
    const loadedAccountPromise = this.stellarSdkService.Server.loadAccount(selectedAccount._id);

    const [
      updatedPath,
      loadedAccount
    ] = await Promise.all([
      updatedPathPromise,
      loadedAccountPromise
    ]);

    const cheapestPath = updatedPath.records.shift();

    if (!cheapestPath) {
      // TODO: add an error alert
      return ;
    }

    const transaction = new TransactionBuilder(new Account(loadedAccount.accountId(), loadedAccount.sequence), {
      fee: this.stellarSdkService.fee,
      networkPassphrase: this.stellarSdkService.networkPassphrase,
    })
      .addOperation(Operation.pathPaymentStrictSend({
        destMin: cheapestPath.destination_amount,
        sendAmount: cheapestPath.source_amount,
        destination: loadedAccount.accountId(),
        destAsset: cheapestPath.destination_asset_type === 'native'
          ? Asset.native()
          : new Asset(cheapestPath.destination_asset_code, cheapestPath.destination_asset_issuer),
        sendAsset: cheapestPath.source_asset_type === 'native'
          ? Asset.native()
          : new Asset(cheapestPath.source_asset_code, cheapestPath.source_asset_issuer),
        path: cheapestPath.path
          .map(item =>
            item.asset_type === 'native'
              ? Asset.native()
              : new Asset(item.asset_code, item.asset_issuer)
          )
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
        this.sendSwapOrder(signedXdr);
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

  async sendSwapOrder(signedXdr: string): Promise<void> {
    try {
      await this.tradeService.sendPathPaymentStrictSend(signedXdr);
      this.toastrService.open({
        message: 'The swap of the assets were successful',
        status: 'success',
        title: 'Operation completed'
      });
    } catch (e) {
      this.toastrService.open({
        message: 'We were not able to complete the swap.',
        status: 'error',
        title: 'Oops!'
      });
    }
  }

}

export interface ISwapForm {
  fromAsset: string;
  toAsset: string;
  amountToSwap: string;
}

import { Component, Input, OnInit } from '@angular/core';
import { switchMap, take } from 'rxjs/operators';
import { AssetSearcherComponent } from '~root/shared/asset-searcher/asset-searcher.component';
import { Observable, of } from 'rxjs';
import { IWalletAssetModel, WalletsAccountsQuery, WalletsAssetsQuery } from '~root/state';
import { WalletsAssetsService } from '~root/core/wallets/services/wallets-assets.service';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import { TranslateService } from '@ngx-translate/core';
import { FormControl, Validators } from '@angular/forms';
import {
  AirtimeService,
  IAirtimeCountry,
  IAirtimeCountryOperator
} from '~root/modules/airtime/services/airtime.service';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import { Networks } from 'soroban-client';
import { NzMessageService } from 'ng-zorro-antd/message';
import { XdrSignerComponent } from '~root/shared/shared-modals/components/xdr-signer/xdr-signer.component';
import { NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { ErrorParserService } from '~root/lib/error-parser/error-parser.service';
import { AirtimeQuery } from '~root/modules/airtime/state/airtime.query';

@Component({
  selector: 'app-mobile-topup-summary',
  templateUrl: './mobile-topup-summary.component.html',
  styleUrls: ['./mobile-topup-summary.component.scss']
})
export class MobileTopupSummaryComponent implements OnInit {
  @Input() phone!: string;
  @Input() country!: IAirtimeCountry;
  @Input() operator!: IAirtimeCountryOperator;
  @Input() amount!: number;

  generatingOrder$ = this.airtimeQuery.generatingOrder$;
  confirmOrder$ = this.airtimeQuery.confirmOrder$;

  selectedWalletAccount$ = this.walletAccountsQuery.getSelectedAccount$;
  myAssets$: Observable<IWalletAssetModel[]> = this.selectedWalletAccount$
    .pipe(switchMap(selectedWalletAccount => {
      if (!selectedWalletAccount || !selectedWalletAccount.accountRecord) {
        return of([]);
      }

      const assetsIds = this.walletsAssetsService.filterBalancesLines(selectedWalletAccount.accountRecord.balances)
        .map(b => this.walletsAssetsService.formatBalanceLineId(b));

      return this.walletsAssetsQuery.getAssetsById(assetsIds);
    }));

  assetPickedControl: FormControl<IWalletAssetModel | null> = new FormControl<IWalletAssetModel | null>(
    null,
    [Validators.required]
  );

  confirmControl: FormControl<boolean | null> = new FormControl<boolean | null>(false, Validators.requiredTrue);

  constructor(
    private readonly walletsAssetsService: WalletsAssetsService,
    private readonly walletsAssetsQuery: WalletsAssetsQuery,
    private readonly walletAccountsQuery: WalletsAccountsQuery,
    private readonly nzDrawerService: NzDrawerService,
    private readonly translateService: TranslateService,
    private readonly stellarSdkService: StellarSdkService,
    private readonly airtimeService: AirtimeService,
    private readonly nzMessageService: NzMessageService,
    private readonly nzModalRef: NzModalRef,
    private readonly nzModalService: NzModalService,
    private readonly errorParserService: ErrorParserService,
    private readonly airtimeQuery: AirtimeQuery,
  ) { }

  ngOnInit(): void {
  }

  async searchAsset(): Promise<void> {
    const myAssets = await this.myAssets$.pipe(take(1)).toPromise();

    this.nzDrawerService.create<AssetSearcherComponent>({
      nzContent: AssetSearcherComponent,
      nzPlacement: 'bottom',
      nzTitle: this.translateService.instant('COMMON_WORDS.MY_ASSETS'),
      nzHeight: '100%',
      nzCloseOnNavigation: true,
      nzWrapClassName: 'ios-safe-y',
      nzContentParams: {
        defaultAssets: myAssets,
        assetSelectedFunc: asset => {
          this.assetPickedControl.setValue(asset);
        },
        disableCustomAsset: true,
        disableCuratedAssetByCreitTech: true,
      }
    });
  }

  async generateOrder(): Promise<void> {
    if (
      !this.operator.id ||
      !this.assetPickedControl.value ||
      !this.amount
    ) {
      return;
    }

    const payingWith = this.stellarSdkService.assetToCanonicalString(
      new this.stellarSdkService.SDK.Asset(
        this.assetPickedControl.value.assetCode,
        this.assetPickedControl.value.assetIssuer,
      )
    );

    let newOrder: { tx: string; network: Networks };
    try {
      newOrder = await this.airtimeService.generateOrder({
        amount: this.amount,
        countryCode: this.country.isoName,
        operatorId: this.operator.id.toString(),
        recipientPhone: this.phone,
        payingWith,
      }).toPromise();
    } catch (e: any) {
      console.error(e);
      this.nzMessageService.error(
        e.error?.message ||
        e.message ||
        'Order generation failed'
      );
      return;
    }

    const orderTransaction = new this.stellarSdkService.SDK.Transaction(
      newOrder.tx,
      newOrder.network
    );

    this.nzDrawerService.create<XdrSignerComponent>({
      nzContent: XdrSignerComponent,
      nzWrapClassName: 'drawer-full-w-340 ios-safe-y',
      nzTitle: this.translateService.instant('COMMON_WORDS.SIGN_TRANSACTION'),
      nzContentParams: {
        xdr: newOrder.tx,
        pickedNetworkPassphrase: newOrder.network,
        signingResultsHandler: data => {
          if (orderTransaction.memo.type !== 'text') {
            this.nzMessageService.error(
              this.translateService.instant('GIFT_CARDS.INVALID_ORDER_REQUEST')
            );
            return;
          }

          this.airtimeService.confirmOrder({
            orderId: orderTransaction.memo.value as string,
            tx: newOrder.tx,
            signatures: data.signers,
          })
            .subscribe({
              next: value => {
                this.nzModalRef.close();
                this.nzModalService.success({
                  nzContent: 'Top up made, you should receive the balance in your phone by 5 minutes from now',
                });
              },
              error: err => {
                this.nzModalService.error({
                  nzContent: `${this.errorParserService.parseCTApiResponse(err)}`,
                });
              }
            });
        }
      }
    });
  }

}

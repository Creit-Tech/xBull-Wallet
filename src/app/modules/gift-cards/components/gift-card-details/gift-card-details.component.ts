import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { distinctUntilChanged, filter, map, switchMap, take, takeUntil, withLatestFrom } from 'rxjs/operators';
import { combineLatest, Observable, of, ReplaySubject, Subject, Subscription } from 'rxjs';
import {
  GiftCardsService,
  IGiftCardDetails,
  IGiftCardOrder
} from '~root/modules/gift-cards/services/gift-cards.service';
import { FormControl, Validators } from '@angular/forms';
import BigNumber from 'bignumber.js';
import { IWalletAssetModel, WalletsAccountsQuery, WalletsAssetsQuery } from '~root/state';
import { WalletsAssetsService } from '~root/core/wallets/services/wallets-assets.service';
import { AssetSearcherComponent } from '~root/shared/asset-searcher/asset-searcher.component';
import { NzDrawerRef, NzDrawerService } from 'ng-zorro-antd/drawer';
import { Asset, MemoType } from 'stellar-sdk';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { HttpErrorResponse } from '@angular/common/http';
import { XdrSignerComponent } from '~root/shared/modals/components/xdr-signer/xdr-signer.component';
import { Networks } from 'stellar-base';
import { NzModalService } from 'ng-zorro-antd/modal';
import { GiftCardsQuery } from '~root/modules/gift-cards/state/gift-cards.query';

@Component({
  selector: 'app-gift-card-details',
  templateUrl: './gift-card-details.component.html',
  styleUrls: ['./gift-card-details.component.scss']
})
export class GiftCardDetailsComponent implements OnInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();

  generatingOrder$ = this.giftCardsQuery.generatingOrder$;
  confirmOrder$ = this.giftCardsQuery.confirmOrder$;

  productId$: ReplaySubject<number> = new ReplaySubject<number>();
  @Input() set productId(value: number | undefined) {
    if (!!value) {
      this.productId$.next(value);
    }
  }

  productDetails$: ReplaySubject<IGiftCardDetails> = new ReplaySubject<IGiftCardDetails>();

  getProductDetailsSubscription: Subscription = this.productId$
    .pipe(filter<number>(Boolean))
    .pipe(distinctUntilChanged())
    .pipe(takeUntil(this.componentDestroyed$))
    .subscribe((productId: number) => {
      this.giftCardsService.getGiftCardProductDetails(productId)
        .subscribe({
          next: value => this.productDetails$.next(value),
        });
    });

  cardAmountControl: FormControl<number | null> = new FormControl<number | null>(null, [Validators.required]);
  assetPickedControl: FormControl<IWalletAssetModel | null> = new FormControl<IWalletAssetModel | null>(
    null,
    [Validators.required]
  );

  feeToPay$: Observable<number> = this.productDetails$.asObservable()
    .pipe(switchMap(productDetails => {
      if (productDetails.feeType === 'fixed') {
        return of(productDetails.fee);
      } else {
        return this.cardAmountControl.valueChanges
          .pipe(map(value => {
            return !!value
              ? new BigNumber(productDetails.fee)
                .multipliedBy(value)
                .toNumber()
              : 0;
          }));
      }
    }));

  total$: Observable<number> = this.cardAmountControl.valueChanges
    .pipe(withLatestFrom(this.feeToPay$))
    .pipe(map(([cardAmount, feeToPay]) => {
      return !!cardAmount ? cardAmount + feeToPay : 0;
    }));

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

  constructor(
    private readonly router: Router,
    private readonly giftCardsService: GiftCardsService,
    private readonly giftCardsQuery: GiftCardsQuery,
    private readonly walletsAssetsService: WalletsAssetsService,
    private readonly walletsAssetsQuery: WalletsAssetsQuery,
    private readonly walletAccountsQuery: WalletsAccountsQuery,
    private readonly nzDrawerService: NzDrawerService,
    private readonly stellarSdkService: StellarSdkService,
    private readonly nzMessageService: NzMessageService,
    private readonly nzModalService: NzModalService,
    private readonly drawerRef: NzDrawerRef,
  ) { }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  async searchAsset(): Promise<void> {
    const myAssets = await this.myAssets$.pipe(take(1)).toPromise();

    this.nzDrawerService.create<AssetSearcherComponent>({
      nzContent: AssetSearcherComponent,
      nzPlacement: 'bottom',
      nzTitle: 'My assets',
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
    const productId = await this.productId$.asObservable()
      .pipe(take(1))
      .toPromise();
    if (
      !productId ||
      !this.cardAmountControl.value ||
      !this.assetPickedControl.value
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
      newOrder = await this.giftCardsService.generateOrder({
        productId,
        payingWith,
        amount: this.cardAmountControl.value,
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
      newOrder.network,
    );

    this.nzDrawerService.create<XdrSignerComponent>({
      nzContent: XdrSignerComponent,
      nzWrapClassName: 'drawer-full-w-320 ios-safe-y',
      nzTitle: 'Sign transaction',
      nzContentParams: {
        xdr: newOrder.tx,
        pickedNetworkPassphrase: newOrder.network,
        signingResultsHandler: data => {
          if (orderTransaction.memo.type !== 'text') {
            this.nzMessageService.error('Generated order is not correctly formatted, please contact support');
            return;
          }

          this.giftCardsService.confirmOrder({
            orderId: orderTransaction.memo.value as string,
            tx: newOrder.tx,
            signatures: data.signers,
          })
            .subscribe({
              next: value => {
                this.drawerRef.close();
                this.nzModalService.success({
                  nzContent: 'Gift Card generated, check the details about it in the orders section',
                });
              },
              error: err => {
                this.nzModalService.error({
                  nzContent: err.error.message || err.message,
                });
              }
            });
        }
      }
    });
  }

}

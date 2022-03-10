import { Component, OnDestroy, OnInit } from '@angular/core';
import { ModalsService } from '~root/shared/modals/modals.service';
import { OfferDetailsComponent } from '~root/modules/wallet/components/offer-details/offer-details.component';
import { WalletsOffersService } from '~root/core/wallets/services/wallets-offers.service';
import { WalletsAccountsService } from '~root/core/wallets/services/wallets-accounts.service';
import { IWalletAsset, WalletsAccountsQuery, WalletsAssetsQuery, WalletsOffersQuery } from '~root/state';
import { forkJoin, from, Observable, of, Subject, Subscription } from 'rxjs';
import { concatMap, distinctUntilKeyChanged, map, mergeMap, switchMap, take, takeUntil, toArray, withLatestFrom } from 'rxjs/operators';
import BigNumber from 'bignumber.js';
import { WalletsAssetsService } from '~root/core/wallets/services/wallets-assets.service';
import { ServerApi } from 'stellar-sdk';
import OfferRecord = ServerApi.OfferRecord;

@Component({
  selector: 'app-wallet-offers',
  templateUrl: './wallet-offers.component.html',
  styleUrls: ['./wallet-offers.component.scss']
})
export class WalletOffersComponent implements OnInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();
  selectedAccount$ = this.walletsAccountsQuery.getSelectedAccount$;

  accountOffers$ = this.selectedAccount$
    .pipe(distinctUntilKeyChanged('_id'))
    .pipe(switchMap(selectedAccount => {
      return this.walletsOffersQuery.getOffersByPublicKey(selectedAccount.publicKey);
    }));

  parsedAccountOffers$: Observable<Array<IParsedAccountOffer>> = this.accountOffers$
    .pipe(switchMap(offers => {
      const assetsIds = offers.reduce((all, current) => {
        const targets = [
          this.walletsAssetsService.formatBalanceLineId(current.selling),
          this.walletsAssetsService.formatBalanceLineId(current.buying)
        ];

        return [
          ...all,
          ...targets,
        ];
      }, [] as string[]);

      return this.walletsAssetsQuery.getAssetsById(assetsIds)
        .pipe(withLatestFrom(of(offers)));
    }))
    .pipe(map(([assets, offers]) => {
      // TODO: let's make this in a more efficient way later
      return offers.map(offer => {
        let sellingAsset!: IWalletAsset<'native', 'full'> | IWalletAsset<'issued', 'full'>;
        let buyingAsset!: IWalletAsset<'native', 'full'> | IWalletAsset<'issued', 'full'>;

        for (const asset of assets) {
          if (asset._id === this.walletsAssetsService.formatBalanceLineId(offer.selling)) {
            sellingAsset = asset as IWalletAsset<'native', 'full'> | IWalletAsset<'issued', 'full'>;
          } else if (asset._id === this.walletsAssetsService.formatBalanceLineId(offer.buying)) {
            buyingAsset = asset as IWalletAsset<'native', 'full'> | IWalletAsset<'issued', 'full'>;
          }
        }

        return {
          offer,
          sellingAssetCode: sellingAsset.assetCode,
          sellingAssetImage: sellingAsset.image,
          sellingAmount: offer.amount,
          buyingAssetCode: buyingAsset.assetCode,
          buyingAssetImage: buyingAsset.image,
          buyingAmount: new BigNumber(offer.amount)
            .multipliedBy(new BigNumber(offer.price))
            .toString()
        };
      });
    }));

  constructor(
    private readonly modalsService: ModalsService,
    private readonly walletsOffersService: WalletsOffersService,
    private readonly walletsOffersQuery: WalletsOffersQuery,
    private readonly walletsAssetsQuery: WalletsAssetsQuery,
    private readonly walletsAssetsService: WalletsAssetsService,
    private readonly walletsAccountsService: WalletsAccountsService,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
  ) { }

  requestOffersSubscription: Subscription = this.selectedAccount$
    .pipe(distinctUntilKeyChanged('_id'))
    .pipe(switchMap(selectedAccount => {
      return this.walletsOffersService.getAccountActiveOffers(selectedAccount.publicKey);
    }))
    .pipe(takeUntil(this.componentDestroyed$))
    .subscribe();

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  async onOfferSelected(data: IParsedAccountOffer): Promise<void> {
    const modalData = await this.modalsService.open<OfferDetailsComponent>({
      component: OfferDetailsComponent
    });

    modalData.componentRef.instance.offer = data.offer;
    modalData.componentRef.instance.sellingAssetCode = data.sellingAssetCode;
    modalData.componentRef.instance.sellingAmount = data.sellingAmount;
    modalData.componentRef.instance.buyingAssetCode = data.buyingAssetCode;
    modalData.componentRef.instance.buyingAmount = data.buyingAmount;

    modalData.componentRef.instance.offerCancelled.asObservable()
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(() => {
        this.walletsOffersService.removeOfferById(data.offer.id);
        modalData.modalContainer.instance.onClose();
      });
  }

}

export interface IParsedAccountOffer {
  offer: OfferRecord;

  // These are just to easily use those parameters in the view
  sellingAssetCode: string;
  sellingAssetImage?: string;
  sellingAmount: string;
  buyingAssetCode: string;
  buyingAssetImage?: string;
  buyingAmount: string;
}

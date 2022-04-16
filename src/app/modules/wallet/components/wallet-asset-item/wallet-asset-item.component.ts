import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { combineLatest, Observable, ReplaySubject, Subject } from 'rxjs';
import { Horizon } from 'stellar-sdk';
import {
  BalanceAssetType,
  HorizonApisQuery,
  IWalletAssetModel,
  WalletsAccountsQuery,
  WalletsAssetsQuery
} from '~root/state';
import { filter, map, switchMap, take, withLatestFrom } from 'rxjs/operators';
import { WalletsAssetsService } from '~root/core/wallets/services/wallets-assets.service';
import BigNumber from 'bignumber.js';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';

@Component({
  selector: 'app-wallet-asset-item',
  templateUrl: './wallet-asset-item.component.html',
  styleUrls: ['./wallet-asset-item.component.scss']
})
export class WalletAssetItemComponent implements OnInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();

  balanceLine$: ReplaySubject<BalanceAssetType> = new ReplaySubject<BalanceAssetType>();
  @Input() set balanceLine(data: BalanceAssetType) {
    this.balanceLine$.next(data);
  }

  asset$: Observable<IWalletAssetModel | undefined> = this.balanceLine$
    .pipe(switchMap(balanceLine => {
      return this.walletsAssetsQuery.selectEntity(
        this.walletsAssetsService.formatBalanceLineId(balanceLine)
      );
    }));

  amount$: Observable<string> = this.balanceLine$
    .pipe(map(data => data.balance));

  // This is the value in regard to the counter asset
  value$: Observable<string> = combineLatest([
    this.asset$,
    this.balanceLine$
  ])
    .pipe(map(([asset, balanceLine]) => {
      return new BigNumber(asset?.counterPrice || '0').multipliedBy(balanceLine.balance)
        .toFixed(7);
    }));

  counterAssetTicker$: Observable<string> = this.asset$
    .pipe(map(asset => {
      if (!asset || !asset.counterId) {
        return '';
      }

      const counterAsset = this.walletsAssetsService.sdkAssetFromAssetId(asset.counterId);
      return counterAsset.getCode();
    }));

  availableFunds$: Observable<string> = combineLatest([
    this.balanceLine$,
    this.walletsAccountsQuery.getSelectedAccount$,
  ])
    .pipe(filter(values => values.every(value => !!value)))
    .pipe(map(([balanceLine, selectedAccount]) => {
      if (!balanceLine || !selectedAccount?.accountRecord) {
        console.warn('Balance or Account record is undefined');
        return new BigNumber(0).toString();
      }

      return this.stellarSdkService
        .calculateAvailableBalance({
          account: selectedAccount.accountRecord,
          balanceLine
        })
        .toString();
    }));

  constructor(
    private readonly walletsAssetsQuery: WalletsAssetsQuery,
    private readonly walletsAssetsService: WalletsAssetsService,
    private readonly horizonApisQuery: HorizonApisQuery,
    private readonly stellarSdkService: StellarSdkService,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
  ) { }

  ngOnInit(): void {
    this.streamAssetPrice();

    this.balanceLine$
      .pipe(filter<any>(balanceLine => {
        return balanceLine.asset_type === 'credit_alphanum12' || balanceLine.asset_type === 'credit_alphanum4';
      }))
      .pipe(withLatestFrom(this.horizonApisQuery.getSelectedHorizonApi$))
      .pipe(switchMap(([balanceLine, horizonApi]) => {
        return (this.asset$ as Observable<IWalletAssetModel>)
          .pipe(map(asset => {
            if (!!asset) {
              return asset;
            } else {
              const initialState = {
                _id: this.walletsAssetsService.formatBalanceLineId(balanceLine),
                assetCode: balanceLine.asset_code,
                assetIssuer: balanceLine.asset_issuer,
                networkPassphrase: horizonApi.networkPassphrase
              };
              this.walletsAssetsService.saveInitialAssetState(initialState);
              return initialState;
            }
          }));
      }))
      .pipe(withLatestFrom(this.horizonApisQuery.getSelectedHorizonApi$))
      .pipe(take(1))
      .subscribe(([asset, horizonApi]) => {
        this.walletsAssetsService.requestAssetInformation$.next({
          asset,
          horizonApi,
          forceUpdate: false
        });
      });
  }

  streamAssetPrice(): void {
    this.asset$
      .pipe<any>(filter(asset => !!asset))
      .pipe(take(1))
      .subscribe(asset => {
        this.walletsAssetsService.updateAssetPriceAgainstCounter(asset)
          .then();
      });
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

}

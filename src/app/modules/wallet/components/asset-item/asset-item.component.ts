import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import {BehaviorSubject, combineLatest, Observable, ReplaySubject, Subject, throwError} from 'rxjs';
import {
  HorizonApisQuery,
  IHorizonApi,
  IWalletAsset, IWalletAssetModel,
  IWalletsAccount,
  WalletsAccountsQuery,
  WalletsAssetsQuery
} from '~root/state';
import { WalletsAssetsService } from '~root/core/wallets/services/wallets-assets.service';
import { Horizon } from 'stellar-sdk';
import { filter, map, switchMap, take, tap, withLatestFrom } from 'rxjs/operators';
import BigNumber from 'bignumber.js';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import { add, isAfter } from 'date-fns';

@Component({
  selector: 'app-asset-item',
  templateUrl: './asset-item.component.html',
  styleUrls: ['./asset-item.component.scss']
})
export class AssetItemComponent implements OnInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();

  skeleton$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  @Input() set skeleton(status: boolean) {
    this.skeleton$.next(status);
  }

  balanceLine$: ReplaySubject<Horizon.BalanceLine> = new ReplaySubject<Horizon.BalanceLine>();
  @Input() set balanceLine(data: Horizon.BalanceLine) {
    this.balanceLine$.next(data);
  }

  asset$: Observable<IWalletAssetModel | undefined> = this.balanceLine$
    .pipe(switchMap(balanceLine =>
      this.walletsAssetsQuery.getAssetsById([
        this.walletsAssetsService.formatBalanceLineId(balanceLine)
      ])
    ))
    .pipe(map(results => results.shift()));


  assetCode$: Observable<string | undefined> = (this.asset$ as Observable<IWalletAssetModel | undefined>)
    .pipe(map(asset => asset?.assetCode));

  assetImg$: Observable<string | undefined> = (this.asset$ as Observable<IWalletAssetModel | undefined>)
    .pipe(map(asset => asset?.image));

  domain$: Observable<string | undefined> = (this.asset$ as Observable<IWalletAssetModel | undefined>)
    .pipe(map(asset => asset?.domain));

  amount$: Observable<string> = this.balanceLine$
    .pipe(map(data => data.balance));

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
    this.asset$
      .pipe(filter<any>((asset: IWalletAsset) => {
        if (!asset || asset._id === 'native') {
          return false;
        }

        if (!asset.lastTimeUpdated) {
          return true;
        }

        const lastUpdate = new Date(asset.lastTimeUpdated);
        // TODO: maybe we should make this time dynamic and configurable form the settings
        const nextUpdate = add(lastUpdate, { minutes: 15 });
        const now = new Date();

        return isAfter(now, nextUpdate);
      }))
      .pipe(take(1))
      .pipe(withLatestFrom(this.horizonApisQuery.getSelectedHorizonApi$))
      .subscribe(([asset, horizonApi]: [IWalletAsset<'issued'>, IHorizonApi]) => {
        this.walletsAssetsService.requestAssetData$.next({
          ...asset,
          horizonApi,
        });
      });
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

}

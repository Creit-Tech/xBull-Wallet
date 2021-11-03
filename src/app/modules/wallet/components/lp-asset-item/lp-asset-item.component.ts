import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Horizon} from 'stellar-sdk';
import {combineLatest, forkJoin, ReplaySubject, Subject} from 'rxjs';
import {filter, map, switchMap, take, takeUntil, withLatestFrom} from 'rxjs/operators';
import {
  HorizonApisQuery,
  IHorizonApi,
  ILpAsset,
  ILpAssetLoaded,
  IWalletAsset,
  LpAssetsQuery,
  WalletsAssetsQuery
} from '~root/state';
import {WalletsAssetsService} from '~root/core/wallets/services/wallets-assets.service';

@Component({
  selector: 'app-lp-asset-item',
  templateUrl: './lp-asset-item.component.html',
  styleUrls: ['./lp-asset-item.component.scss']
})
export class LpAssetItemComponent implements OnInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();

  balanceLine$: ReplaySubject<Horizon.BalanceLine<'liquidity_pool_shares'>> = new ReplaySubject<Horizon.BalanceLine<'liquidity_pool_shares'>>();
  @Input() set balanceLine(data: Horizon.BalanceLine<'liquidity_pool_shares'>) {
    this.balanceLine$.next(data);
  }

  balanceLineAmount$ = this.balanceLine$
  .pipe(filter<any>(Boolean))
  .pipe(map((balanceLine: Horizon.BalanceLine<'liquidity_pool_shares'>) => {
    return balanceLine.balance;
  }));

  lpAsset$ = this.balanceLine$
    .pipe(switchMap(b => this.lpAssetsQuery.selectEntity(b.liquidity_pool_id)));

  reserves$: Observable<Array<IWalletAsset<any, 'full'>>> = this.lpAsset$
    .pipe(filter<any>(lpAsset => !!lpAsset?.dataLoaded))
    .pipe(switchMap((lpAsset: ILpAssetLoaded) => {
      const [assetACode, assetBCode] = lpAsset.reserves.map(reserve => {
        return reserve.asset.includes(':')
          ? reserve.asset.split(':')[0] + '_' + reserve.asset.split(':')[1]
          : 'native';
      });

      return combineLatest([
        this.walletsAssetsQuery.selectEntity(assetACode),
        this.walletsAssetsQuery.selectEntity(assetBCode),
      ]);
    })) as Observable<Array<IWalletAsset<any, 'full'>>>;


  constructor(
    private readonly lpAssetsQuery: LpAssetsQuery,
    private readonly walletsAssetsService: WalletsAssetsService,
    private readonly horizonApisQuery: HorizonApisQuery,
    private readonly walletsAssetsQuery: WalletsAssetsQuery,
  ) { }

  ngOnInit(): void {
    this.lpAsset$
      .pipe(filter<any>(Boolean))
      .pipe(take(1))
      .pipe(withLatestFrom(this.horizonApisQuery.getSelectedHorizonApi$))
      .pipe(switchMap((data: [ILpAsset, IHorizonApi]) => {
        return this.walletsAssetsService.getLiquidityPoolsData({
          lpId: data[0]._id,
          horizonApi: data[1],
        });
      }))
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe();
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  parseCodes(assets: Array<IWalletAsset<any, 'full'>> | null): string {
    return (assets || [])
      .map(asset => asset.assetCode)
      .join(':');
  }

}

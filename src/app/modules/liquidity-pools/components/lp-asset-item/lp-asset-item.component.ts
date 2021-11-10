import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {combineLatest, ReplaySubject, Subject} from 'rxjs';
import { filter, map, mergeMap, pluck, switchMap, take, takeUntil, withLatestFrom } from 'rxjs/operators';
import {
  HorizonApisQuery,
  IHorizonApi,
  ILpAsset,
  ILpAssetLoaded,
  IWalletAsset,
  LpAssetsQuery, WalletsAccountsQuery,
  WalletsAssetsQuery,
} from '~root/state';
import {WalletsAssetsService} from '~root/core/wallets/services/wallets-assets.service';
import { Horizon } from 'stellar-sdk';
import { LiquidityPoolsService } from '~root/core/services/liquidity-pools.service';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { sequence } from '@angular/animations';
import { NzDrawerRef, NzDrawerService } from 'ng-zorro-antd/drawer';
import { XdrSignerComponent } from '~root/shared/modals/components/xdr-signer/xdr-signer.component';

@Component({
  selector: 'app-lp-asset-item',
  templateUrl: './lp-asset-item.component.html',
  styleUrls: ['./lp-asset-item.component.scss']
})
export class LpAssetItemComponent implements OnInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();

  lpAssetId$: ReplaySubject<ILpAsset['_id']> = new ReplaySubject<ILpAsset['_id']>();
  @Input() set lpAssetId(data: ILpAsset['_id']) {
    this.lpAssetId$.next(data);
  }

  sharesAmount$: ReplaySubject<string | number> = new ReplaySubject<string | number>();
  @Input() set sharesAmount(data: string | number) {
    this.sharesAmount$.next(data);
  }

  lpAsset$ = this.lpAssetId$
    .pipe(switchMap(lpAssetId => this.lpAssetsQuery.selectEntity(lpAssetId)));

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
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly walletsAssetsService: WalletsAssetsService,
    private readonly horizonApisQuery: HorizonApisQuery,
    private readonly walletsAssetsQuery: WalletsAssetsQuery,
    private readonly liquidityPoolsService: LiquidityPoolsService,
  ) { }

  ngOnInit(): void {
    this.lpAsset$
      .pipe(filter<any>(Boolean))
      .pipe(take(1))
      .pipe(withLatestFrom(this.horizonApisQuery.getSelectedHorizonApi$))
      .pipe(switchMap((data: [ILpAsset, IHorizonApi]) => {
        return this.liquidityPoolsService.getLiquidityPoolsData({
          lpId: data[0]._id,
          horizonApi: data[1],
        });
      }))
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe();


    this.lpAsset$
      .pipe(filter<any>(Boolean))
      .pipe(take(1))
      .pipe(pluck<ILpAssetLoaded, ILpAssetLoaded['reserves']>('reserves'))
      .pipe(filter<any>(Boolean))
      .pipe(map((reserves: ILpAssetLoaded['reserves']) => {
        const mappedData = reserves
          .reduce((all: { [x: string]: Horizon.Reserve }, current: Horizon.Reserve) => {
            if (current.asset !== 'native' && !all[current.asset]) {
              all[current.asset] = current;
            }

            return all;
          }, {});

        return Object.values(mappedData);
      }))
      .pipe(mergeMap(reserve => reserve))
      .pipe(withLatestFrom(this.horizonApisQuery.getSelectedHorizonApi$))
      .pipe(switchMap(([reserve, horizonApi]) => {
        const assetCode = reserve.asset.split(':')[0] as string;
        const assetIssuer = reserve.asset.split(':')[1] as string;

        this.walletsAssetsService.saveInitialAssetState({
          _id: `${assetCode}_${assetIssuer}`,
          assetCode,
          assetIssuer
        });

        return this.walletsAssetsService.getAssetExtraRecord({
          _id: `${assetCode}_${assetIssuer}`,
          assetCode,
          assetIssuer,
          horizonApi,
        })
          .pipe(switchMap(_ => {
            return this.walletsAssetsService.getAssetFullRecord({
              _id: `${assetCode}_${assetIssuer}`,
              assetCode,
              assetIssuer,
              horizonApi,
            });
          }));
      }))
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe();
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  parseCodes(assets: Array<IWalletAsset<any, 'full'>> | null): string | null {
    const codes = (assets || [])
      .map(asset => asset?.assetCode);

    return codes.every(c => !!c) ? codes.join(':') : null;
  }

}

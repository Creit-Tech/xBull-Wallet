import {Component, Input, OnInit} from '@angular/core';
import {NzDrawerRef} from "ng-zorro-antd/drawer";
import {filter, switchMap} from "rxjs/operators";
import {ILpAssetLoaded, IWalletAsset, LpAssetsQuery, WalletsAssetsQuery} from "~root/state";
import {combineLatest, ReplaySubject, Subject} from "rxjs";
import {Horizon} from "stellar-sdk";

@Component({
  selector: 'app-lp-asset-details',
  templateUrl: './lp-asset-details.component.html',
  styleUrls: ['./lp-asset-details.component.scss']
})
export class LpAssetDetailsComponent implements OnInit {
  lpAssetId$: ReplaySubject<string> = new ReplaySubject<string>();
  @Input() set lpAssetId(data: string) {
    this.lpAssetId$.next(data);
  }

  lpAsset$: Observable<ILpAssetLoaded> = this.lpAssetId$
    .pipe(switchMap(lpAssetId => this.lpAssetsQuery.selectEntity(lpAssetId))) as Observable<ILpAssetLoaded>;

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
    private readonly nzDrawerRef: NzDrawerRef,
    private readonly lpAssetsQuery: LpAssetsQuery,
    private readonly walletsAssetsQuery: WalletsAssetsQuery
  ) { }

  ngOnInit(): void {
  }

  parseLpReserveCode(reserve: Horizon.Reserve): string {
    return reserve.asset.includes(':')
      ? reserve.asset.split(':')[0]
      : 'XLM';
  }

}

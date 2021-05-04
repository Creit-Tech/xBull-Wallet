import { Component, Input, OnInit } from '@angular/core';
import { IWalletAsset, IWalletIssuedAsset, IWalletNativeAsset, WalletsAssetsQuery } from '~root/core/wallets/state';
import { ReplaySubject } from 'rxjs';
import { filter, map, switchMap, take } from 'rxjs/operators';
import { WalletsAssetsService } from '~root/core/wallets/services/wallets-assets.service';

@Component({
  selector: 'app-asset-details',
  templateUrl: './asset-details.component.html',
  styleUrls: ['./asset-details.component.scss']
})
export class AssetDetailsComponent implements OnInit {
  assetId$: ReplaySubject<IWalletAsset['_id']> = new ReplaySubject<IWalletAsset['_id']>();
  @Input() set assetId(data: IWalletAsset['_id']) {
    this.assetId$.next(data);
  }

  asset$ = this.assetId$
    .pipe(switchMap(assetId => this.walletsAssetsQuery.getAssetsById([assetId])))
    .pipe(map(assets => assets.shift()));

  nativeAsset$: Observable<IWalletNativeAsset<'full'>> = this.asset$
    .pipe(filter(asset => !!asset && asset._id === 'native')) as any;

  issuedAsset$: Observable<IWalletIssuedAsset<'full'>> = this.asset$
    .pipe(filter(asset => !!asset && asset._id !== 'native')) as any;

  fullDataLoaded$: Observable<boolean> = this.asset$
    .pipe(map(asset => !!asset && asset.assetFullDataLoaded));

  constructor(
    private readonly walletsAssetsQuery: WalletsAssetsQuery,
    private readonly walletsAssetsService: WalletsAssetsService,
  ) { }

  ngOnInit(): void {
    this.issuedAsset$
      .pipe(filter((asset) => !!asset))
      .pipe(take(1))
      .pipe(switchMap((asset) => {
        return this.walletsAssetsService.getAssetExtraRecord({
          _id: asset._id,
          assetCode: asset.assetCode,
          assetIssuer: asset.assetIssuer,
        })
          .pipe(map(() => asset));
      }))
      .pipe(switchMap((asset) => {
        return this.walletsAssetsService.getAssetFullRecord({
          _id: asset._id,
          assetCode: asset.assetCode,
          assetIssuer: asset.assetIssuer,
        });
      }))
      .subscribe();
  }

}

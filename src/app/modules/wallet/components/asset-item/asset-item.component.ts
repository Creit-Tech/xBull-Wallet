import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Observable, ReplaySubject, Subject, throwError } from 'rxjs';
import { IWalletAsset, WalletsAssetsQuery } from '~root/state';
import { WalletsAssetsService } from '~root/core/wallets/services/wallets-assets.service';
import { Horizon } from 'stellar-sdk';
import { filter, map, switchMap, take, tap } from 'rxjs/operators';

@Component({
  selector: 'app-asset-item',
  templateUrl: './asset-item.component.html',
  styleUrls: ['./asset-item.component.scss']
})
export class AssetItemComponent implements OnInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();
  sellingLiabilities$: ReplaySubject<string> = new ReplaySubject<string>();

  skeleton$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  @Input() set skeleton(status: boolean) {
    this.skeleton$.next(status);
  }

  balanceLine$: ReplaySubject<Horizon.BalanceLine> = new ReplaySubject<Horizon.BalanceLine>();
  @Input() set balanceLine(data: Horizon.BalanceLine) {
    this.balanceLine$.next(data);
  }

  asset$: Observable<IWalletAsset | undefined> = this.balanceLine$
    .pipe(switchMap(balanceLine =>
      this.walletsAssetsQuery.getAssetsById([
        this.walletsAssetsService.formatBalanceLineId(balanceLine)
      ])
    ))
    .pipe(map(results => results.shift()));

  assetCode$: Observable<string | undefined> = (this.asset$ as Observable<IWalletAsset | undefined>)
    .pipe(map(asset => asset?.assetCode));

  assetImg$: Observable<string | undefined> = (this.asset$ as Observable<IWalletAsset<any, 'full'> | undefined>)
    .pipe(map(asset => asset?.image));

  domain$: Observable<string | undefined> = (this.asset$ as Observable<IWalletAsset<any, 'full'> | undefined>)
    .pipe(map(asset => asset?.domain));

  amount$: Observable<string> = this.balanceLine$
    .pipe(map(data => data.balance));

  constructor(
    private readonly walletsAssetsQuery: WalletsAssetsQuery,
    private readonly walletsAssetsService: WalletsAssetsService,
  ) { }

  ngOnInit(): void {
    this.asset$
      .pipe(filter(asset => !!asset && asset._id !== 'native'))
      .pipe(take(1))
      .pipe(switchMap<any, Observable<IWalletAsset<'issued'>>>((asset) => {
        return this.walletsAssetsService.getAssetExtraRecord(asset)
          .pipe(map(() => asset));
      }))
      .pipe(switchMap((asset) => {
        return this.walletsAssetsService.getAssetFullRecord(asset);
      }))
      .subscribe();
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

}

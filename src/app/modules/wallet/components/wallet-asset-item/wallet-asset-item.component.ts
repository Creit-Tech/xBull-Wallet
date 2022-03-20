import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Observable, ReplaySubject, Subject } from 'rxjs';
import { Horizon } from 'stellar-sdk';
import {
  BalanceAssetType,
  HorizonApisQuery,
  IWalletAssetIssued,
  IWalletAssetNative,
  WalletsAssetsQuery
} from '~root/state';
import { filter, map, switchMap, take, withLatestFrom } from 'rxjs/operators';
import { WalletsAssetsService } from '~root/core/wallets/services/wallets-assets.service';

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

  asset$: Observable<IWalletAssetNative | IWalletAssetIssued | undefined> = this.balanceLine$
    .pipe(switchMap(balanceLine => {
      return this.walletsAssetsQuery.selectEntity(
        this.walletsAssetsService.formatBalanceLineId(balanceLine)
      );
    }));

  constructor(
    private readonly walletsAssetsQuery: WalletsAssetsQuery,
    private readonly walletsAssetsService: WalletsAssetsService,
    private readonly horizonApisQuery: HorizonApisQuery,
  ) { }

  ngOnInit(): void {
    this.balanceLine$
      .pipe(filter<any>(balanceLine => {
        return balanceLine.asset_type === 'credit_alphanum12' || balanceLine.asset_type === 'credit_alphanum4';
      }))
      .pipe(withLatestFrom(this.horizonApisQuery.getSelectedHorizonApi$))
      .pipe(switchMap(([balanceLine, horizonApi]) => {
        return (this.asset$ as Observable<IWalletAssetIssued>)
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

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

}

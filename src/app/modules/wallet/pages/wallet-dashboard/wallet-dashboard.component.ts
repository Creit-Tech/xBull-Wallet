import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import {
  ILpAsset, IWalletAssetIssued,
  IWalletAssetNative,
  IWalletsAccount,
  LpAssetsQuery,
  WalletsAccountsQuery,
  WalletsAssetsQuery
} from '~root/state';
import { distinctUntilChanged, filter, map, switchMap, withLatestFrom } from 'rxjs/operators';
import { WalletsAssetsService } from '~root/core/wallets/services/wallets-assets.service';
import { Horizon } from 'stellar-sdk';
import BalanceLineLiquidityPool = Horizon.BalanceLineLiquidityPool;
import BalanceLine = Horizon.BalanceLine;
import BigNumber from 'bignumber.js';

@Component({
  selector: 'app-wallet-dashboard',
  templateUrl: './wallet-dashboard.component.html',
  styleUrls: ['./wallet-dashboard.component.scss']
})
export class WalletDashboardComponent implements OnInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();
  selectedAccount$: Observable<IWalletsAccount> = this.walletsAccountsQuery.getSelectedAccount$;

  accountBalanceLines$: Observable<BalanceLine[]> = this.selectedAccount$
    .pipe(map(selectedAccount => selectedAccount?.accountRecord?.balances || []));

  accountBalancesAssets$ = this.selectedAccount$
    .pipe(map(selectedAccount => {
      if (!selectedAccount || !selectedAccount.accountRecord) {
        return [];
      }

      return this.walletsAssetsService.filterBalancesLines(selectedAccount.accountRecord.balances);
    }));

  counterAssetCode$ = this.walletsAssetsQuery.counterAsset$
    .pipe(map(asset => asset?.assetCode));

  totalBalanceOnCounterAsset$: Observable<string> = this.accountBalanceLines$
    .pipe(map(bs => this.walletsAssetsService.filterBalancesLines(bs)))
    .pipe(distinctUntilChanged((a, b) => {
      return JSON.stringify(a) === JSON.stringify(b);
    }))
    .pipe(map(accountBalanceLines => {
      return accountBalanceLines.reduce((total, current) => {
        const asset = this.walletsAssetsQuery.getEntity(this.walletsAssetsService.formatBalanceLineId(current));

        return !asset || !asset.counterPrice
          ? total
          : new BigNumber(total)
            .plus(
              new BigNumber(asset.counterPrice).multipliedBy(current.balance)
            );
      }, new BigNumber(0))
        .toFixed(7);
    }));

  lpAssetsBalances$: Observable<BalanceLineLiquidityPool[]> = this.selectedAccount$
    .pipe(map(selectedAccount => {
      if (!selectedAccount || !selectedAccount.accountRecord) {
        return [];
      }

      return selectedAccount.accountRecord
        .balances
        .filter(b => b.asset_type === 'liquidity_pool_shares') as BalanceLineLiquidityPool[];
    }));

  lpAssetsBalancesTotalShares$: Observable<string> = this.lpAssetsBalances$
    .pipe(map(lpAssetsBalances =>
      lpAssetsBalances.reduce((total, current) => {
        return new BigNumber(total).plus(current.balance);
      }, new BigNumber(0))
    ))
    .pipe(map(value => value.toFixed(7)));

  constructor(
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly walletsAssetsQuery: WalletsAssetsQuery,
    private readonly walletsAssetsService: WalletsAssetsService,
    private readonly lpAssetsQuery: LpAssetsQuery,
  ) { }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
  }

  trackByBalanceline(index: number, item: Horizon.BalanceLine): string {
    return item.balance;
  }

}

interface DataItem {
  name: string;
  age: number;
  address: string;
}

interface IAssetItem {
  asset: IWalletAssetNative | IWalletAssetIssued;
  assetCode: string;
  domain: string;
  balance: string;
  available: string;
  image?: string;
}

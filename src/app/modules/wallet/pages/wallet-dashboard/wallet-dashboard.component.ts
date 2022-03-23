import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import {
  IWalletAssetIssued,
  IWalletAssetNative,
  IWalletsAccount,
  LpAssetsQuery,
  WalletsAccountsQuery,
  WalletsAssetsQuery
} from '~root/state';
import { distinctUntilChanged, map, withLatestFrom } from 'rxjs/operators';
import { WalletsAssetsService } from '~root/core/wallets/services/wallets-assets.service';
import { Horizon } from 'stellar-sdk';
import BigNumber from 'bignumber.js';
import { Color, LegendPosition, ScaleType } from '@swimlane/ngx-charts';
import BalanceLineLiquidityPool = Horizon.BalanceLineLiquidityPool;
import BalanceLine = Horizon.BalanceLine;

@Component({
  selector: 'app-wallet-dashboard',
  templateUrl: './wallet-dashboard.component.html',
  styleUrls: ['./wallet-dashboard.component.scss']
})
export class WalletDashboardComponent implements OnInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();
  selectedAccount$: Observable<IWalletsAccount> = this.walletsAccountsQuery.getSelectedAccount$;

  accountBalanceLines$: Observable<BalanceLine[]> = this.selectedAccount$
    .pipe(map(selectedAccount => selectedAccount?.accountRecord?.balances || []))
    .pipe(distinctUntilChanged((a, b) => {
      return JSON.stringify(a) === JSON.stringify(b);
    }));

  accountBalancesRegularAssets$ = this.accountBalanceLines$
    .pipe(map(balanceLines => {
      return this.walletsAssetsService.filterBalancesLines(balanceLines);
    }));

  counterAssetCode$ = this.walletsAssetsQuery.counterAsset$
    .pipe(map(asset => asset?.assetCode));

  assetsBalancesWithCounterValues$: Observable<Array<{ asset?: IWalletAssetIssued | IWalletAssetNative; counterValue: BigNumber }>> = this.accountBalancesRegularAssets$
    .pipe(map(accountBalanceLines => {
      return accountBalanceLines.map(b => {
        const asset = this.walletsAssetsQuery.getEntity(this.walletsAssetsService.formatBalanceLineId(b));
        return {
          asset,
          counterValue: !asset || !asset.counterPrice
            ? new BigNumber(0)
            : new BigNumber(asset.counterPrice).multipliedBy(b.balance)
        };
      });
    }));

  totalBalanceOnCounterAsset$: Observable<string> = this.assetsBalancesWithCounterValues$
    .pipe(map(values => {
      return values.reduce((total, current) => {
        return current.asset?.counterPrice && !(new BigNumber(current.asset.counterPrice).isNaN())
          ? new BigNumber(current.counterValue).plus(total)
          : total;
      }, new BigNumber(0)).toFixed(7);
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

  // Graphs
  balanceGraphValues$: Observable<Array<{ name?: string; value: number }>> = this.assetsBalancesWithCounterValues$
    .pipe(withLatestFrom(this.totalBalanceOnCounterAsset$))
    .pipe(map(([values, totalBalanceOnCounterAsset]) => values.map(value => {
      return {
        name: value.asset?.assetCode,
        value: new BigNumber(value.counterValue).dividedBy(totalBalanceOnCounterAsset).multipliedBy(100).toNumber()
      };
    })));

  sizeOfPortfolioGraphValues$: Observable<Array<{ name?: string; value: number }>> = this.accountBalancesRegularAssets$
    .pipe(map(balances => {
      const totalBalanceOfAssets = balances.reduce((total, current) => {
        return new BigNumber(current.balance).plus(total);
      }, new BigNumber(0));

      return balances.map(b => {
        const balanceLineId = this.walletsAssetsService.formatBalanceLineId(b);
        const asset = this.walletsAssetsService.sdkAssetFromAssetId(balanceLineId);
        return {
          name: asset.code,
          value: new BigNumber(b.balance).dividedBy(totalBalanceOfAssets).multipliedBy(100).toNumber(),
        };
      });
    }));

  legendPosition = LegendPosition.Below;
  graphColors: Color = {
    name: 'xbull',
    selectable: true,
    domain: ['#C19CFC', '#9977D3', '#7354AC', '#4E3286', '#281262'],
    group: ScaleType.Linear,
  };
  graphTooltipFormatter = (value: any) => {
    return `<b>${value.data.name}</b><br><span>${new BigNumber(value.data.value).toFixed(2)}%</span>`;
  }

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

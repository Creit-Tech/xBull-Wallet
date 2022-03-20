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
import { map, switchMap } from 'rxjs/operators';
import { WalletsAssetsService } from '~root/core/wallets/services/wallets-assets.service';
import { Horizon } from 'stellar-sdk';

@Component({
  selector: 'app-wallet-dashboard',
  templateUrl: './wallet-dashboard.component.html',
  styleUrls: ['./wallet-dashboard.component.scss']
})
export class WalletDashboardComponent implements OnInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();
  selectedAccount$: Observable<IWalletsAccount> = this.walletsAccountsQuery.getSelectedAccount$;

  accountBalances$ = this.selectedAccount$
    .pipe(map(selectedAccount => {
      if (!selectedAccount || !selectedAccount.accountRecord) {
        return [];
      }

      return this.walletsAssetsService.filterBalancesLines(selectedAccount.accountRecord.balances);
    }));

  // lpAssetsBalances$: Observable<ILpAsset[]> = this.lpAssetsQuery.selectAll()
  //   .pipe(switchMap(lpAssets => {
  //     return this.selectedAccount$
  //       .pipe(selectedAccount => {
  //         return lpAssets.filter(lpAsset => {
  //           selectedAccount.
  //         })
  //       });
  //   }));

  searchValue = '';
  visible = false;
  listOfData: DataItem[] = [
    {
      name: 'John Brown',
      age: 32,
      address: 'New York No. 1 Lake Park'
    },
    {
      name: 'Jim Green',
      age: 42,
      address: 'London No. 1 Lake Park'
    },
    {
      name: 'Joe Black',
      age: 32,
      address: 'Sidney No. 1 Lake Park'
    },
    {
      name: 'Jim Red',
      age: 32,
      address: 'London No. 2 Lake Park'
    }
  ];
  listOfDisplayData = [...this.listOfData];

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

  reset(): void {
    this.searchValue = '';
    this.search();
  }

  search(): void {
    this.visible = false;
    this.listOfDisplayData = this.listOfData.filter((item: DataItem) => item.name.indexOf(this.searchValue) !== -1);
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

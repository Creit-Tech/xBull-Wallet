import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, merge, Observable, Subject } from 'rxjs';
import {
  HorizonApisQuery, IWalletAssetModel,
  IWalletsAccount,
  LpAssetsQuery, SettingsQuery,
  WalletsAccountsQuery,
  WalletsAssetsQuery
} from '~root/state';
import {
  debounceTime, distinct,
  distinctUntilChanged,
  filter,
  map,
  switchMap,
  take,
  takeUntil, tap,
  withLatestFrom
} from 'rxjs/operators';
import { WalletsAssetsService } from '~root/core/wallets/services/wallets-assets.service';
import { AccountResponse, AssetType, Horizon } from 'stellar-sdk';
import BigNumber from 'bignumber.js';
import { Color, LegendPosition, ScaleType } from '@swimlane/ngx-charts';
import BalanceLineLiquidityPool = Horizon.BalanceLineLiquidityPool;
import BalanceLine = Horizon.BalanceLine;
import { FormControl, FormGroup } from '@angular/forms';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import BalanceLineNative = Horizon.BalanceLineNative;
import {
  LpAssetDetailsComponent
} from '~root/modules/liquidity-pools/components/lp-asset-details/lp-asset-details.component';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import { AssetDetailsComponent } from '~root/modules/wallet/components/asset-details/asset-details.component';
import { AssetSearcherComponent } from '~root/shared/asset-searcher/asset-searcher.component';
import { NzMessageService } from 'ng-zorro-antd/message';
import { XdrSignerComponent } from '~root/shared/modals/components/xdr-signer/xdr-signer.component';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-wallet-dashboard',
  templateUrl: './wallet-dashboard.component.html',
  styleUrls: ['./wallet-dashboard.component.scss']
})
export class WalletDashboardComponent implements OnInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();
  selectedAccount$: Observable<IWalletsAccount> = this.walletsAccountsQuery.getSelectedAccount$;

  graphTypeControl: FormControl = new FormControl('value_distribution');

  disableAddAssetButton$ = new BehaviorSubject<boolean>(false);
  addingAsset$ = this.walletsAssetsQuery.addingAsset$;

  accountBalanceLines$: Observable<BalanceLine[]> = this.selectedAccount$
    .pipe(map(selectedAccount => selectedAccount?.accountRecord?.balances || []))
    .pipe(distinctUntilChanged((a, b) => {
      return JSON.stringify(a) === JSON.stringify(b);
    }));

  counterAssetCode$ = this.settingsQuery.counterAssetId$
    .pipe(map(assetId => this.walletsAssetsService.sdkAssetFromAssetId(assetId)))
    .pipe(map(asset => asset?.code));

  accountBalancesRegularAssets$ = this.accountBalanceLines$
    .pipe(map(balanceLines => {
      return this.walletsAssetsService.filterBalancesLines(balanceLines);
    }));

  assetsBalancesWithCounterValues$: Observable<Array<{
    asset?: IWalletAssetModel;
    counterValue: BigNumber
  }>> = this.accountBalancesRegularAssets$
    .pipe(switchMap(accountBalanceLines => {
      const objectMap = new Map();

      for (const accountBalanceLine of accountBalanceLines) {
        objectMap.set(this.walletsAssetsService.formatBalanceLineId(accountBalanceLine), accountBalanceLine);
      }

      return this.walletsAssetsQuery.selectAll({
        filterBy: entity => !!objectMap.get(entity._id)
      })
        .pipe(debounceTime(100))
        .pipe(map(assets => {
          return assets.map(asset => ({
            asset,
            counterValue: !asset || !asset.counterPrice
              ? new BigNumber(0)
              : new BigNumber(asset.counterPrice)
                .multipliedBy(objectMap.get(asset._id).balance)
          }))
            .filter(data => !!data.asset);
        }));
    }));

  lockedXLMs$: Observable<string> = this.accountBalancesRegularAssets$
    .pipe(withLatestFrom(this.selectedAccount$))
    .pipe(map(([balances, selectedAccount]) => {
      const nativeValue: BalanceLineNative = balances.find(b => b.asset_type === 'native') as BalanceLineNative;
      if (!selectedAccount.accountRecord) {
        return  '0';
      }

      return new BigNumber(nativeValue.balance)
        .minus(
          this.stellarSdkService.calculateAvailableBalance({
            account: selectedAccount.accountRecord,
            balanceLine: nativeValue
          })
        )
        .toFixed(7);
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

  // ----- Graphs
  balanceGraphValues$: Observable<Array<{ name?: string; value: number }>> = this.assetsBalancesWithCounterValues$
    .pipe(withLatestFrom(this.totalBalanceOnCounterAsset$))
    .pipe(map(([values, totalBalanceOnCounterAsset]) => values.map(value => {
      return {
        name: value.asset?.assetCode || '',
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
          name: asset.code || '',
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
  // ----- END Graphs

  constructor(
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly walletsAssetsQuery: WalletsAssetsQuery,
    private readonly walletsAssetsService: WalletsAssetsService,
    private readonly lpAssetsQuery: LpAssetsQuery,
    private readonly stellarSdkService: StellarSdkService,
    private readonly nzDrawerService: NzDrawerService,
    private readonly nzMessageService: NzMessageService,
    private readonly horizonApisQuery: HorizonApisQuery,
    private readonly settingsQuery: SettingsQuery,
    private readonly translateService: TranslateService,
  ) { }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
  }

  trackByBalanceline(index: number, item: Horizon.BalanceLine): string {
    return item.balance;
  }

  async addAsset(): Promise<void> {
    const drawerTitle = await this.translateService.instant('WALLET.WALLET_DASHBOARD.SELECT_ASSET_TITLE');

    this.nzDrawerService.create<AssetSearcherComponent>({
      nzContent: AssetSearcherComponent,
      nzPlacement: 'bottom',
      nzTitle: drawerTitle,
      nzHeight: '100%',
      nzCloseOnNavigation: true,
      nzWrapClassName: 'ios-safe-y',
      nzContentParams: {
        assetSelectedFunc: async asset => {
          this.disableAddAssetButton$.next(true);
          try {
            await this.signAndConfirmAddAsset(asset);
          } catch (e) {}
          this.disableAddAssetButton$.next(false);
        },
        disableMyAssets: true,
      }
    });
  }

  async signAndConfirmAddAsset(asset: IWalletAssetModel): Promise<void> {
    if (!asset) {
      return;
    }

    const selectedAccount = await this.walletsAccountsQuery.getSelectedAccount$
      .pipe(take(1))
      .toPromise();

    if (!selectedAccount) {
      return;
    }

    let loadedAccount: AccountResponse;
    try {
      loadedAccount = await this.stellarSdkService.Server.loadAccount(selectedAccount.publicKey);
    } catch (e) {
      this.nzMessageService.error(this.translateService.instant('ERROR_MESSAGES.CANT_FETCH_ACCOUNT_FROM_HORIZON'));
      return;
    }

    const account = new this.stellarSdkService.SDK.Account(loadedAccount.accountId(), loadedAccount.sequence);

    const transaction = new this.stellarSdkService.SDK.TransactionBuilder(account, {
      networkPassphrase: this.stellarSdkService.networkPassphrase,
      fee: this.stellarSdkService.fee,
    })
      .addOperation(
        this.stellarSdkService.SDK.Operation.changeTrust({
          asset: new this.stellarSdkService.SDK.Asset(
            asset.assetCode,
            asset.assetIssuer
          )
        }),
      )
      .setTimeout(this.stellarSdkService.defaultTimeout)
      .build();

    this.nzDrawerService.create<XdrSignerComponent>({
      nzContent: XdrSignerComponent,
      nzWrapClassName: 'drawer-full-w-320 ios-safe-y',
      nzTitle: this.translateService.instant('WALLET.WALLET_DASHBOARD.ADD_ASSET_TITLE'),
      nzContentParams: {
        xdr: transaction.toXDR(),
        acceptHandler: async signedXdr => {
          if (!signedXdr) {
            this.nzMessageService.error(this.translateService.instant('ERROR_MESSAGES.UNEXPECTED_ERROR'));
            return;
          }

          try {
            await this.walletsAssetsService.addAssetToAccount(signedXdr);
            this.nzMessageService.success(this.translateService.instant('WALLET.WALLET_DASHBOARD.ADD_ASSET_SUCCESS'));
          } catch (e) {
            console.error(e);
            this.nzMessageService.error(this.translateService.instant('ERROR_MESSAGES.NETWORK_REJECTED'), {
              nzDuration: 5000,
            });
            return;
          }

          const horizonApi = await this.horizonApisQuery.getSelectedHorizonApi$
            .pipe(take(1)).toPromise();

          this.walletsAssetsService.requestAssetInformation$.next({
            asset: {
              _id: asset._id,
              assetIssuer: asset.assetIssuer,
              assetCode: asset.assetCode,
              networkPassphrase: horizonApi.networkPassphrase,
            },
            horizonApi,
            forceUpdate: false
          });
        }
      }
    });
  }

  async assetDetails(balanceLine: Horizon.BalanceLine): Promise<void> {
    const drawerRef = this.nzDrawerService.create<AssetDetailsComponent>({
      nzContent: AssetDetailsComponent,
      nzTitle: this.translateService.instant('WALLET.WALLET_DASHBOARD.ASSET_DETAILS_TITLE'),
      nzWrapClassName: 'drawer-full-w-320 ios-safe-y',
      nzContentParams: {
        assetId: this.walletsAssetsService.formatBalanceLineId(balanceLine)
      }
    });

    drawerRef.open();
  }

  async lpAssetDetails(balanceLine: Horizon.BalanceLine<AssetType.liquidityPoolShares>): Promise<void> {
    const drawerRef = this.nzDrawerService.create<LpAssetDetailsComponent>({
      nzContent: LpAssetDetailsComponent,
      nzTitle: this.translateService.instant('WALLET.WALLET_DASHBOARD.LP_ASSET_DETAILS_TITLE'),
      nzWrapClassName: 'drawer-full-w-320 ios-safe-y',
      nzContentParams: {
        lpAssetId: balanceLine.liquidity_pool_id,
      }
    });

    drawerRef.open();
  }

}

interface DataItem {
  name: string;
  age: number;
  address: string;
}

interface IAssetItem {
  asset: IWalletAssetModel;
  assetCode: string;
  domain: string;
  balance: string;
  available: string;
  image?: string;
}

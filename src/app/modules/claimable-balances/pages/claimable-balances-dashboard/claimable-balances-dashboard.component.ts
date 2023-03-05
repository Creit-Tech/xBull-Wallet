import { Component, OnDestroy, OnInit } from '@angular/core';
import { ClaimableBalancesService } from '~root/core/services/claimable-balances.service';
import {
  ClaimableBalancesQuery,
  HorizonApisQuery,
  IWalletsAccount,
  SettingsQuery,
  WalletsAccountsQuery, WalletsAssetsQuery
} from '~root/state';
import {
  debounceTime, distinct, distinctUntilChanged,
  distinctUntilKeyChanged,
  filter,
  map,
  pluck,
  switchMap,
  take, takeUntil,
  withLatestFrom
} from 'rxjs/operators';
import { NzMessageService } from 'ng-zorro-antd/message';
import { WalletsAssetsService } from '~root/core/wallets/services/wallets-assets.service';
import { combineLatest, Observable, of, Subject } from 'rxjs';
import { ServerApi } from 'stellar-sdk';
import ClaimableBalanceRecord = ServerApi.ClaimableBalanceRecord;
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import {
  ClaimableBalanceDetailsComponent
} from '~root/modules/claimable-balances/components/claimable-balance-details/claimable-balance-details.component';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-claimable-balances-dashboard',
  templateUrl: './claimable-balances-dashboard.component.html',
  styleUrls: ['./claimable-balances-dashboard.component.scss']
})
export class ClaimableBalancesDashboardComponent implements OnInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();
  claimableBalances$ = this.claimableBalancesQuery.selectedAccountClaimableBalances$;

  antiSpamClaimableAssets$ = this.settingsQuery.antiSpamClaimableAssets$;

  filteredClaimableBalances$ = this.claimableBalances$
    .pipe(withLatestFrom(this.antiSpamClaimableAssets$))
    .pipe(map(([records, blockedAssets]) => {
      // Filter ignored assets
      return records.filter(record => {
        return !blockedAssets.find(blockedAsset => blockedAsset === record.asset);
      });
    }))
    .pipe(withLatestFrom(this.walletsAccountsQuery.getSelectedAccount$))
    .pipe(map(([records, selectedAccount]) => {
      if (!selectedAccount) {
        return [];
      }

      return records
        .filter(record => {
          const targetClaimant = record.claimants.find(c => c.destination === selectedAccount.publicKey);
          if (!targetClaimant) {
            console.warn('There seems to be an issue with the claimable balance: ' + record.id);
            return false;
          }
          return this.claimableBalancesService.canBeClaimed(targetClaimant.predicate);
        });
    }));

  listItems$: Observable<IClaimableBalanceLineItem[]> = this.filteredClaimableBalances$
    .pipe(switchMap((filteredClaimableBalances) => {
      return this.walletsAssetsQuery.selectAll({
        filterBy: entity => {
          return !!filteredClaimableBalances
            .find(c => entity._id === this.walletsAssetsService.assetIdFromAssetString(c.asset));
        }
      })
        .pipe(distinctUntilChanged((a, b) => JSON.stringify(a) !== JSON.stringify(b)))
        .pipe(map(assets => {
          const items = [];
          for (const asset of assets) {
            const claimableBalance = filteredClaimableBalances
              .find(c => this.walletsAssetsService.assetIdFromAssetString(c.asset) === asset._id);
            if (!!claimableBalance) {
              items.push({
                _id: claimableBalance.id,
                image: asset.image,
                assetCode: asset.assetCode,
                amount: claimableBalance.amount,
                assetIssuer: asset.assetIssuer,
                domain: asset.domain,
              });
            }
          }
          return items;
        }));
    }));


  constructor(
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly walletsAssetsService: WalletsAssetsService,
    private readonly walletsAssetsQuery: WalletsAssetsQuery,
    private readonly claimableBalancesService: ClaimableBalancesService,
    private readonly claimableBalancesQuery: ClaimableBalancesQuery,
    private readonly nzMessageService: NzMessageService,
    private readonly horizonApisQuery: HorizonApisQuery,
    private readonly settingsQuery: SettingsQuery,
    private readonly nzDrawerService: NzDrawerService,
    private readonly translateService: TranslateService,
  ) { }

  ngOnInit(): void {
    this.walletsAccountsQuery.getSelectedAccount$
      .pipe(distinctUntilKeyChanged('_id'))
      .pipe(filter<any>(Boolean))
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe((selectedAccount: IWalletsAccount) => {
        this.getClaimableBalancesAndAssetsData(selectedAccount);
      });
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  async getClaimableBalancesAndAssetsData(selectedAccount: IWalletsAccount): Promise<void> {
    const horizonApi = await this.horizonApisQuery.getSelectedHorizonApi$.pipe(take(1)).toPromise();

    if (!horizonApi) {
      return;
    }

    let balances;
    try {
      balances = await this.claimableBalancesService.getClaimableBalancesForClaimant(selectedAccount);
    } catch (e) {
      this.nzMessageService.error(this.translateService.instant('ERROR_MESSAGES.CANT_CONTACT_HORIZON'));
      return;
    }

    const assetsToRetrieve = balances.records.filter(r => r.asset !== 'native');

    for (const claimableBalance of assetsToRetrieve) {
      const assetId = this.walletsAssetsService.assetIdFromAssetString(claimableBalance.asset);
      const assetInitialState = {
        _id: assetId,
        assetIssuer: claimableBalance.asset.split(':')[1],
        assetCode: claimableBalance.asset.split(':')[0],
        networkPassphrase: horizonApi.networkPassphrase,
      };
      this.walletsAssetsService.saveInitialAssetState(assetInitialState);
      this.walletsAssetsService.requestAssetInformation$.next({
        asset: assetInitialState,
        horizonApi,
        forceUpdate: false
      });
    }
  }

  openClaimableBalanceDetails(claimableBalanceId: string): void {
    this.nzDrawerService.create<ClaimableBalanceDetailsComponent>({
      nzContent: ClaimableBalanceDetailsComponent,
      nzContentParams: { claimableBalanceId },
      nzTitle: this.translateService.instant('COMMON_WORDS.DETAILS'),
      nzWrapClassName: 'drawer-full-w-340 ios-safe-y',
    });
  }

}

interface IClaimableBalanceLineItem {
  _id: string;
  image?: string;
  assetCode: string;
  amount: string;
  assetIssuer?: string;
  domain?: string;
}

import { Component, OnDestroy, OnInit } from '@angular/core';
import { Color, ScaleType } from '@swimlane/ngx-charts';
import { ActivatedRoute } from '@angular/router';
import { EarnStrategiesQuery } from '~root/modules/earn/state/strategies/earn-strategies.query';
import {
  catchError,
  concatAll, debounce,
  debounceTime, distinct, distinctUntilChanged,
  distinctUntilKeyChanged, filter,
  map,
  switchMap,
  take,
  takeUntil, tap
} from 'rxjs/operators';
import { EarnStrategiesService } from '~root/modules/earn/services/earn-strategies.service';
import {
  asapScheduler,
  BehaviorSubject,
  combineLatest,
  firstValueFrom,
  of,
  scheduled,
  Subject,
  Subscription,
  timer
} from 'rxjs';
import BigNumber from 'bignumber.js';
import { WalletsAccountsQuery } from '~root/state';
import { FormControl, Validators } from '@angular/forms';
import { EarnVaultsService, IConfirmVaultCreationParams } from '~root/modules/earn/state/vaults/earn-vaults.service';
import { EarnVaultsQuery } from '~root/modules/earn/state/vaults/earn-vaults.query';
import { IEarnVault, VaultStatus } from '~root/modules/earn/state/vaults/earn-vault.model';
import { NzMessageService } from 'ng-zorro-antd/message';
import { XdrSignerComponent } from '~root/shared/shared-modals/components/xdr-signer/xdr-signer.component';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import { NzModalService } from 'ng-zorro-antd/modal';
import { distinctUntilArrayItemChanged } from '@datorama/akita';

@Component({
  selector: 'app-strategy-details',
  templateUrl: './strategy-details.component.html',
  styleUrls: ['./strategy-details.component.scss']
})
export class StrategyDetailsComponent implements OnInit, OnDestroy {
  componentDestroyed$ = new Subject<void>();

  graphFilterControl = new FormControl('strategy_aprapy', [Validators.required]);
  graphFilter$: BehaviorSubject<'apr' | 'tvl' | 'tokenPrice'> = new BehaviorSubject<'apr' | 'tvl' | 'tokenPrice'>('apr');
  results$: BehaviorSubject<IGraphResult[]> = new BehaviorSubject<IGraphResult[]>([]);
  graphColors: Color = {
    name: 'xbull',
    selectable: true,
    domain: ['#C19CFC', '#9977D3', '#7354AC', '#4E3286', '#281262'],
    group: ScaleType.Linear,
  };

  strategyId$ = this.route.params.pipe(map(params => params.strategyId));
  strategy$ = this.strategyId$
    .pipe(switchMap(strategyId => {
      return this.earnStrategiesQuery.selectAll({
        filterBy: entity => entity._id === strategyId
      });
    }))
    .pipe(map(results => results[0]));

  vault$ = this.strategyId$
    .pipe(switchMap(strategyId => {
      return this.selectedAccount$
        .pipe(distinctUntilKeyChanged('_id'))
        .pipe(switchMap(selectedAccount => {
          return this.earnVaultsQuery.selectAll({
            filterBy: entity => entity.strategyId === strategyId
              && entity.depositorPublicKey === selectedAccount.publicKey
              && entity.status !== VaultStatus.CANCELLED,
          });
        }));
    }))
    .pipe(map(results => results[0]));

  creatingVault$ = this.earnVaultsQuery.creatingVault$;

  selectedAccount$ = this.walletsAccountsQuery.getSelectedAccount$;

  fetchUpdatedSnapshots: Subscription = timer(0, 5000)
    .pipe(switchMap(_ => this.strategyId$))
    .pipe(switchMap(strategyId => {
      // TODO: make this easier to read
      return this.earnStrategiesService.getStrategySnapshots(strategyId)
        .pipe(map(snapshots => {
          return [
            {
              name: 'APY',
              series: snapshots.map(item => ({
                name: new Date(item.datePeriod),
                value: (item.apy * 100) || 0
              }))
            },
            {
              name: 'APR',
              series: snapshots.map(item => ({
                name: new Date(item.datePeriod),
                value: (item.apr * 100) || 0
              }))
            }
          ];
        }))
        .pipe(catchError(err => {
          return of([]);
        }));
    }))
    .pipe(takeUntil(this.componentDestroyed$))
    .subscribe((value: any) => {
      if (value.length > 0) {
        this.results$.next(value);
      }
    }); // TODO: review this type 'any'


  // TODO: make this three observables one and use a filter instead, maybe it's better that way
  vaultApyAprSnapshot$ = this.vault$
    .pipe(filter(vault => !!vault?.snapshots))
    .pipe(map(vault => vault?.snapshots))
    .pipe(distinctUntilArrayItemChanged())
    .pipe(map((snapshots = []) => {
      const reversed = [...snapshots].reverse();
      return [
        {
          name: 'APR',
          series: reversed.map((r) => ({
            name: new Date(r.datePeriod),
            value: (r.apr * 100) || 0,
          })),
        },
        {
          name: 'APY',
          series: reversed.map((r) => ({
            name: new Date(r.datePeriod),
            value: (r.apy * 100) || 0,
          })),
        },
      ];
    }));

  vaultTvlSnapshot$ = this.vault$
    .pipe(filter(vault => !!vault?.snapshots))
    .pipe(map(vault => vault?.snapshots))
    .pipe(distinctUntilArrayItemChanged())
    .pipe(map((snapshots = []) => {
      const reversed = [...snapshots].reverse();
      return [
        {
          name: 'TVL',
          series: reversed.map((r) => ({
            name: new Date(r.datePeriod),
            value: r.tvl,
          })),
        },
        {
          name: 'USD TVL',
          series: reversed.map((r) => ({
            name: new Date(r.datePeriod),
            value: r.usdTvl,
          })),
        },
      ];
    }));

  vaultPoolSharesTvlSnapshot$ = this.vault$
    .pipe(filter(vault => !!vault?.snapshots))
    .pipe(map(vault => vault?.snapshots))
    .pipe(distinctUntilArrayItemChanged())
    .pipe(map((snapshots = []) => {
      const reversed = [...snapshots].reverse();
      return [
        {
          name: 'Pool shares',
          series: reversed.map((r) => ({
            name: new Date(r.datePeriod),
            value: r.poolShares,
          })),
        },
      ];
    }));

  constructor(
    private readonly route: ActivatedRoute,
    private readonly earnStrategiesQuery: EarnStrategiesQuery,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly earnStrategiesService: EarnStrategiesService,
    private readonly earnVaultsService: EarnVaultsService,
    private readonly earnVaultsQuery: EarnVaultsQuery,
    private readonly nzMessageService: NzMessageService,
    private readonly nzDrawerService: NzDrawerService,
    private readonly nzModalService: NzModalService,
  ) { }

  ngOnInit(): void {
    this.strategyId$
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(strategyId => {
        this.earnStrategiesService.getStrategyDetails(strategyId)
          .subscribe();
      });


    timer(0, 10000)
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(() => {
        this.earnVaultsService.getVaults()
          .subscribe();
      });

    this.vault$
      .pipe(filter(val => !!val))
      .pipe(distinctUntilKeyChanged('_id'))
      .pipe(switchMap(vault => {
        return timer(0, 10000)
          .pipe(switchMap(() => this.earnVaultsService.getVaultSnapshots(vault._id)));
      }))
      .pipe(takeUntil(this.componentDestroyed$.asObservable()))
      .subscribe();
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  async createOrConfirmVault(): Promise<void> {
    let baseXDR: string;
    let vaultId: IEarnVault['_id'];
    const strategy = await firstValueFrom(this.strategy$);
    const vault = await firstValueFrom(this.vault$);

    if (!vault || vault.status === VaultStatus.CANCELLED) {
      try {
        const response = await firstValueFrom(this.earnVaultsService.createVault(
          strategy._id,
        ));

        baseXDR = response.creationXDR;
        vaultId = response._id;
      } catch (e) {
        this.nzModalService.error({
          nzContent: 'Vault creation was not possible, contact support. (code: SD-1746664)'
        });
        return;
      }
    } else {
      baseXDR = vault.creationXDR;
      vaultId = vault._id;
    }

    const drawerRef = this.nzDrawerService.create<XdrSignerComponent>({
      nzContent: XdrSignerComponent,
      nzContentParams: {
        xdr: baseXDR,
        signingResultsHandler: data => {
          this.confirmVaultCreation({
            vaultId,
            baseXDR,
            signers: data.signers
          });
          drawerRef.close();
        },
      },
      nzTitle: 'Confirm creation of the vault',
      nzWrapClassName: 'drawer-full-w-340 ios-safe-y',
    });
  }

  confirmVaultCreation(params: IConfirmVaultCreationParams): void {
    const messageId = this.nzMessageService.loading(
      'Confirming Vault creation...',
      { nzDuration: 0 }
    ).messageId;
    this.earnVaultsService.confirmVaultCreation(params)
      .subscribe({
        next: value => {
          this.nzMessageService.remove(messageId);
          this.nzMessageService.success('Vault confirmed, you can now use it to yield farm in the network');
        },
        error: err => {
          this.earnVaultsService.getVault(params.vaultId).subscribe();
          this.nzMessageService.remove(messageId);
          this.nzModalService.error({
            nzContent:
              'Vault creation failed because it was rejected by the network, make sure your account meets the initial requirements',
          });
        },
      });
  }

}

export interface IGraphResult {
  name: string;
  series: Array<{
    value: number;
    name: Date;
  }>;
}

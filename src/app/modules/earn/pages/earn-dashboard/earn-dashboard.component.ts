import { Component, OnDestroy, OnInit } from '@angular/core';
import { EarnStrategiesService } from '~root/modules/earn/services/earn-strategies.service';
import { EarnStrategiesQuery, IStrategyWithVault } from '~root/modules/earn/state/strategies/earn-strategies.query';
import { EarnVaultsQuery } from '~root/modules/earn/state/vaults/earn-vaults.query';
import { EarnVaultsService } from '~root/modules/earn/state/vaults/earn-vaults.service';
import { BehaviorSubject, Subject } from 'rxjs';
import { NzTableFilterFn, NzTableFilterList, NzTableSortFn, NzTableSortOrder } from 'ng-zorro-antd/table';
import { filter, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-earn-dashboard',
  templateUrl: './earn-dashboard.component.html',
  styleUrls: ['./earn-dashboard.component.scss']
})
export class EarnDashboardComponent implements OnInit, OnDestroy {
  componentDestroyed$ = new Subject();
  requestingStrategies$ = this.earnStrategiesQuery.requestingStrategies$;
  earnStrategies$ = this.earnStrategiesQuery.selectAll();

  data$ = this.earnStrategiesQuery.getStrategiesWithActiveVault();

  constructor(
    private readonly earnStrategiesQuery: EarnStrategiesQuery,
    private readonly earnStrategiesService: EarnStrategiesService,
    private readonly earnVaultsQuery: EarnVaultsQuery,
    private readonly earnVaultsService: EarnVaultsService,
  ) { }

  ngOnInit(): void {
    this.earnStrategiesService.getEarnStrategies().subscribe();
    this.earnVaultsService.getVaults().subscribe();
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  sortByStrategyApr(a: IStrategyWithVault, b: IStrategyWithVault): number {
    return a.apr - b.apr;
  }

  sortByVaultPosition(a: IStrategyWithVault, b: IStrategyWithVault): number {
    return (a.vault?.tvl || 0) - (b.vault?.tvl || 0);
  }

  sortByVaultAPY(a: IStrategyWithVault, b: IStrategyWithVault): number {
    return (a.vault?.apy || 0) - (b.vault?.apy || 0);
  }

}

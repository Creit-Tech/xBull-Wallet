import { Injectable } from '@angular/core';
import { combineQueries, Order, QueryEntity } from '@datorama/akita';
import { EarnStrategiesState, EarnStrategiesStore } from './earn-strategies.store';
import { EarnVaultsQuery } from '~root/modules/earn/state/vaults/earn-vaults.query';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { IEarnStrategy } from '~root/modules/earn/state/strategies/earn-strategy.model';
import { IEarnVault } from '~root/modules/earn/state/vaults/earn-vault.model';

@Injectable()
export class EarnStrategiesQuery extends QueryEntity<EarnStrategiesState> {
  requestingStrategies$ = this.select(state => state.requestingStrategies);
  authenticationToken$ = this.select(state => state.authenticationToken);

  constructor(
    protected store: EarnStrategiesStore,
    private readonly earnVaultsQuery: EarnVaultsQuery,
  ) {
    super(store);
  }

  getStrategiesWithActiveVault(): Observable<IStrategyWithVault[]> {
    return combineQueries([
      this.selectAll({ sortBy: 'apr', sortByOrder: Order.DESC }),
      this.earnVaultsQuery.selectAll({
        filterBy: entity => entity.status === 'ACTIVE'
      }),
    ])
      .pipe(map(([strategies, vaults]) => {
        return strategies.map(strategy => ({
          ...strategy,
          vault: vaults.find(vault =>
            vault.strategyId === strategy._id
            && vault.status === 'ACTIVE'
          ),
        }));
      }));
  }

}

export type IStrategyWithVault = IEarnStrategy & { vault?: IEarnVault };

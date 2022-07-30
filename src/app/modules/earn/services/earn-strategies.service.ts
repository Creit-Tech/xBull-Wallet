import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ENV, environment } from '~env';
import { createEarnStrategy, IEarnStrategy } from '~root/modules/earn/state/strategies/earn-strategy.model';
import { EarnStrategiesStore } from '~root/modules/earn/state/strategies/earn-strategies.store';
import { catchError, map, tap } from 'rxjs/operators';
import { applyTransaction } from '@datorama/akita';
import { Observable, throwError } from 'rxjs';

@Injectable()
export class EarnStrategiesService {

  constructor(
    @Inject(ENV)
    private readonly env: typeof environment,
    private readonly http: HttpClient,
    private readonly earnStrategiesStore: EarnStrategiesStore
  ) { }

  getStrategyDetails(strategyId: IEarnStrategy['_id']): Observable<IEarnStrategy> {
    this.earnStrategiesStore.updateUIState({ requestingStrategies: true });
    return this.http.get<{ strategy: IEarnStrategy }>(`${this.env.xPointersApi}/strategies/${strategyId}`)
      .pipe(map(response => {
        const strategy = createEarnStrategy(response.strategy);
        applyTransaction(() => {
          this.earnStrategiesStore.updateUIState({ requestingStrategies: false });
          this.earnStrategiesStore.upsertMany([strategy]);
        });

        return strategy;
      }))
      .pipe(catchError(error => {
        this.earnStrategiesStore.updateUIState({ requestingStrategies: false });
        return throwError(error);
      }));
  }

  getStrategySnapshots(strategyId: IEarnStrategy['_id']): Observable<IEarnStrategySnapshot[]> {
    this.earnStrategiesStore.updateUIState({ requestingStrategiesSnapshots: true });
    return this.http.get<{ stats: IEarnStrategySnapshot[]}>(`${this.env.xPointersApi}/strategies/${strategyId}/snapshots`)
      .pipe(tap(_ => this.earnStrategiesStore.updateUIState({ requestingStrategiesSnapshots: false })))
      .pipe(map(response => response.stats || []))
      .pipe(catchError(error => {
        this.earnStrategiesStore.updateUIState({ requestingStrategiesSnapshots: false });
        return throwError(error);
      }));
  }

  getEarnStrategies(): Observable<IEarnStrategy[]> {
    this.earnStrategiesStore.updateUIState({ requestingStrategies: true });
    return this.http.get<{ data: IEarnStrategy[] }>(`${this.env.xPointersApi}/strategies`)
      .pipe(map(response => {
        const strategies = response.data.map(createEarnStrategy);
        applyTransaction(() => {
          this.earnStrategiesStore.updateUIState({ requestingStrategies: false });
          this.earnStrategiesStore.upsertMany(strategies);
        });

        return strategies;
      }))
      .pipe(catchError(error => {
        this.earnStrategiesStore.updateUIState({ requestingStrategies: false });
        return throwError(error);
      }));
  }
}

export type IEarnStrategySnapshot = { datePeriod: string, strategyId: string }
  & Pick<IEarnStrategy,
      '_id' |
      'apr' |
      'createdAt' |
      'daysToEarn' |
      'tokenPrice' |
      'totalSharesIssued' |
      'tvl' |
      'updatedAt'
    >;

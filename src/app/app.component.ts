import { AfterViewInit, Component, OnInit } from '@angular/core';
import { WalletsAccountsService } from '~root/core/wallets/services/wallets-accounts.service';
import { HorizonApisQuery, WalletsAccountsQuery, WalletsOperationsQuery } from '~root/state';
import { combineLatest, forkJoin, of, pipe, Subscription } from 'rxjs';
import { debounceTime, distinctUntilKeyChanged, filter, switchMap, take, tap, withLatestFrom } from 'rxjs/operators';
import { Order, selectPersistStateInit } from '@datorama/akita';
import { WalletsOperationsService } from '~root/core/wallets/services/wallets-operations.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  constructor(
    private readonly walletsAccountsService: WalletsAccountsService,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly walletsOperationsService: WalletsOperationsService,
    private readonly walletsOperationsQuery: WalletsOperationsQuery,
    private readonly horizonApisQuery: HorizonApisQuery,
  ) { }


  accountWithHorizonQuery$ = selectPersistStateInit()
    .pipe(switchMap(() => {
      const selectedAccount$ = this.walletsAccountsQuery.getSelectedAccount$
        .pipe(filter(account => !!account))
        .pipe(distinctUntilKeyChanged('_id'));

      const selectedHorizonApi$ = this.horizonApisQuery.getSelectedHorizonApi$
        .pipe(filter(horizon => !!horizon))
        .pipe(distinctUntilKeyChanged('_id'));

      return combineLatest([
        selectedAccount$,
        selectedHorizonApi$
      ]);
    }));

  createWalletsOperationsQuery: Subscription = this.accountWithHorizonQuery$
    .pipe(switchMap(([account, horizonApi]) => {
      return combineLatest([
        of(account),
        of(horizonApi),
        this.walletsOperationsQuery.selectAll({
          filterBy: entity => entity.ownerAccount === account.publicKey,
          sortBy: (entityA, entityB) => entityA.createdAt - entityB.createdAt,
        }).pipe(take(1))
      ]);
    }))
    .subscribe(([account, horizonApi, operations]) => {
      const lastValue = operations[operations.length - 1];
      const firstNonHandled = operations.find(operation => !operation.operationHandled);
      this.walletsAccountsService.createOperationsStream({
        account,
        order: 'asc',
        cursor: firstNonHandled?.pagingToken || lastValue?.pagingToken,
        horizonApi
      });
    });

  createWalletsAccountsQuery: Subscription = this.accountWithHorizonQuery$
    .pipe(debounceTime(100))
    .subscribe(([account, horizonApi]) => {
      this.walletsAccountsService.createAccountStream({ account, horizonApi });
    });

}

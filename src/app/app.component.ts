import { AfterViewInit, Component, OnInit } from '@angular/core';
import { WalletsAccountsService } from '~root/core/wallets/services/wallets-accounts.service';
import { HorizonApisQuery, WalletsAccountsQuery, WalletsOperationsQuery } from '~root/state';
import { combineLatest, of, pipe, Subscription } from 'rxjs';
import { debounceTime, distinctUntilKeyChanged, filter, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { Order, selectPersistStateInit } from '@datorama/akita';
import { WalletsOperationsService } from '~root/core/wallets/services/wallets-operations.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'xBull - Wallet';

  constructor(
    private readonly walletsAccountsService: WalletsAccountsService,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly walletsOperationsService: WalletsOperationsService,
    private readonly walletsOperationsQuery: WalletsOperationsQuery,
    private readonly horizonApisQuery: HorizonApisQuery,
  ) { }

  createWalletsOperationsQuery: Subscription = selectPersistStateInit()
    .pipe(switchMap(() => this.walletsAccountsQuery.getSelectedAccount$))
    .pipe(filter(account => !!account))
    .pipe(distinctUntilKeyChanged('_id'))
    .pipe(switchMap(account => {
      return of(account)
        .pipe(withLatestFrom(this.walletsOperationsQuery.selectAll({
          filterBy: entity => entity.ownerAccount === account.publicKey,
          sortBy: (entityA, entityB) => entityA.createdAt - entityB.createdAt,
        })));
    }))
    .subscribe(([account, operations]) => {
      const lastValue = operations[operations.length - 1];
      const firstNonHandled = operations.find(operation => !operation.operationHandled);
      this.walletsOperationsService.createStream({
        account,
        order: 'asc',
        cursor: firstNonHandled?.pagingToken || lastValue?.pagingToken,
      });
    });

  createWalletsAccountsQuery: Subscription = selectPersistStateInit()
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
    }))
    .pipe(debounceTime(100))
    .subscribe(([account, horizonApi]) => {
      this.walletsAccountsService.createStream({ account, horizonApi });
    });

  ngOnInit(): void {
  }


}

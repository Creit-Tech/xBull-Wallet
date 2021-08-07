import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ModalsService } from '~root/shared/modals/modals.service';
import { TransactionDetailsComponent } from '~root/modules/wallet/components/transaction-details/transaction-details.component';
import { BehaviorSubject, combineLatest, of, Subject, Subscription } from 'rxjs';
import {
  HorizonApisQuery,
  IWalletsAccount,
  IWalletsOperation,
  SettingsQuery,
  WalletsAccountsQuery,
  WalletsOperationsQuery,
} from '~root/state';
import { debounceTime, distinctUntilKeyChanged, exhaustMap, filter, map, pluck, switchMap, takeUntil, tap } from 'rxjs/operators';
import { Order } from '@datorama/akita';
import { Networks } from 'stellar-base';

@Component({
  selector: 'app-wallet-transactions',
  templateUrl: './wallet-transactions.component.html',
  styleUrls: ['./wallet-transactions.component.scss']
})
export class WalletTransactionsComponent implements OnInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();
  selectedAccount$ = this.walletsAccountsQuery.getSelectedAccount$;
  accountOperations$: Observable<IWalletsOperation[]> = this.selectedAccount$
    .pipe(filter(account => !!account))
    .pipe(distinctUntilKeyChanged('_id'))
    .pipe(exhaustMap(account => {
      return this.walletsOperationsQuery.selectAll({
        filterBy: entity => entity.ownerAccount === account._id,
        sortBy: (entityA, entityB) => entityB.createdAt - entityA.createdAt,
      });
    }))
    .pipe(debounceTime(10));

  filteredOperations$: Observable<IWalletsOperation[]> = combineLatest([
    this.accountOperations$,
    this.settingsQuery.operationTypesToShow$
  ]).pipe(map(([operations, operationTypesToShow]) => {
    return operations.filter(operation => operationTypesToShow.indexOf(operation.operationRecord.type) !== -1);
  }));

  weAreInTestNet$ = this.horizonApisQuery.getSelectedHorizonApi$
    .pipe(pluck('networkPassphrase'))
    .pipe(map(networkPassphrase => networkPassphrase === Networks.TESTNET));

  constructor(
    private readonly modalsService: ModalsService,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly walletsOperationsQuery: WalletsOperationsQuery,
    private readonly cdr: ChangeDetectorRef,
    private readonly horizonApisQuery: HorizonApisQuery,
    private readonly settingsQuery: SettingsQuery,
  ) { }

  ngOnInit(): void {
    this.accountOperations$.subscribe(console.log);
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  async onSelected(operation: IWalletsOperation) {
    const modalData = await this.modalsService.open<TransactionDetailsComponent>({
      component: TransactionDetailsComponent,
      componentInputs: [{
        input: 'operation',
        value: operation
      }]
    });

    console.log({ modalData });
  }

}

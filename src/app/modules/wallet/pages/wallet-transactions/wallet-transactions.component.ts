import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ModalsService } from '~root/shared/modals/modals.service';
import { TransactionDetailsComponent } from '~root/modules/wallet/components/transaction-details/transaction-details.component';
import { BehaviorSubject, of, Subject, Subscription } from 'rxjs';
import { IWalletsAccount, IWalletsOperation, WalletsAccountsQuery, WalletsOperationsQuery } from '~root/state';
import { debounceTime, distinctUntilKeyChanged, exhaustMap, filter, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { Order } from '@datorama/akita';

@Component({
  selector: 'app-wallet-transactions',
  templateUrl: './wallet-transactions.component.html',
  styleUrls: ['./wallet-transactions.component.scss']
})
export class WalletTransactionsComponent implements OnInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();
  selectedAccount$: Observable<IWalletsAccount> = this.walletsAccountsQuery.getSelectedAccount$;
  accountOperations$: Observable<IWalletsOperation[]> = this.selectedAccount$
    .pipe(filter(account => !!account))
    .pipe(distinctUntilKeyChanged('_id'))
    .pipe(exhaustMap(account => {
      return this.walletsOperationsQuery.selectAll({
        filterBy: entity => entity.ownerAccount === account._id && entity.operationHandled,
        sortBy: (entityA, entityB) => entityB.createdAt - entityA.createdAt,
      });
    }))
    .pipe(debounceTime(10))

    // A hack because for some reason the view doesn't want to update with the observable (I'm probably missing something obvious)
    // TODO: We need to update this
    //.pipe(tap(() => setTimeout(() => this.cdr.detectChanges(), 10)));

  constructor(
    private readonly modalsService: ModalsService,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly walletsOperationsQuery: WalletsOperationsQuery,
    private readonly cdr: ChangeDetectorRef,
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

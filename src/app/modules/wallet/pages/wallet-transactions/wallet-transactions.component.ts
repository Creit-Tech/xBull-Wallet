import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ModalsService } from '~root/shared/modals/modals.service';
import { TransactionDetailsComponent } from '~root/modules/wallet/components/transaction-details/transaction-details.component';
import { combineLatest, Subject } from 'rxjs';
import {
  HorizonApisQuery,
  IWalletsOperation,
  SettingsQuery,
  WalletsAccountsQuery,
  WalletsOperationsQuery,
} from '~root/state';
import {
  debounceTime,
  distinctUntilKeyChanged,
  exhaustMap,
  filter,
  map,
  pluck,
  withLatestFrom
} from 'rxjs/operators';
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
    .pipe(withLatestFrom(this.settingsQuery.antiSpamPublicKeys$))
    .pipe(exhaustMap(([account, antiSpamPublicKeys]) => {
      return this.walletsOperationsQuery.selectAll({
        filterBy: entity => entity.ownerAccount === account._id
          && !antiSpamPublicKeys.find(key => entity.operationRecord.source_account === key),
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
  }

}

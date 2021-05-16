import { Component, OnDestroy, OnInit } from '@angular/core';
import { ModalsService } from '~root/shared/modals/modals.service';
import { TransactionDetailsComponent } from '~root/modules/wallet/components/transaction-details/transaction-details.component';
import { Subject } from 'rxjs';
import { IWalletsAccount, IWalletsOperation, WalletsAccountsQuery, WalletsOperationsQuery } from '~root/core/wallets/state';
import { distinctUntilKeyChanged, filter, switchMap } from 'rxjs/operators';
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
    .pipe(switchMap(account => {
      return this.walletsOperationsQuery.selectAll({
        filterBy: entity => entity.ownerAccount === account._id && entity.operationHandled,
        sortBy: (entityA, entityB) => entityB.createdAt - entityA.createdAt,
      });
    }));

  constructor(
    private readonly modalsService: ModalsService,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly walletsOperationsQuery: WalletsOperationsQuery,
  ) { }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
  }

  onSelected() {
    this.modalsService.open({ component: TransactionDetailsComponent });
  }

}

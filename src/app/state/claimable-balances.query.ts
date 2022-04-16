import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { ClaimableBalancesStore, ClaimableBalancesState } from './claimable-balances.store';
import { IWalletsAccount } from '~root/state/wallets-account.model';
import { Observable, of } from 'rxjs';
import { ServerApi } from 'stellar-sdk';
import { WalletsAccountsQuery } from '~root/state/wallets-accounts.query';
import { distinctUntilKeyChanged, switchMap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ClaimableBalancesQuery extends QueryEntity<ClaimableBalancesState> {
  gettingClaimableBalances$ = this.select(state => state.UIState.gettingClaimableBalances);
  claimingBalance$ = this.select(state => state.UIState.claimingBalance);

  selectedAccountClaimableBalances$: Observable<ServerApi.ClaimableBalanceRecord[]> = this.walletsAccountsQuery.getSelectedAccount$
    .pipe(distinctUntilKeyChanged('_id'))
    .pipe(switchMap(selectedAccount => {
      if (!selectedAccount) {
        return of([]);
      }

      return this.selectAll({
        filterBy: entity => entity.accountId === selectedAccount._id,
      });
    }));

  constructor(
    protected store: ClaimableBalancesStore,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
  ) {
    super(store);
  }

  claimableBalancesForWalletAccount(accountId: IWalletsAccount['_id']): Observable<ServerApi.ClaimableBalanceRecord[]> {
    return this.selectAll({
      filterBy: entity => entity.accountId === accountId,
    });
  }

}

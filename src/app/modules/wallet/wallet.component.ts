import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { exhaustMap, map, pluck, switchMap, take } from 'rxjs/operators';
import { ModalsService } from '~root/shared/modals/modals.service';
import { IWalletsAccount, WalletsAccountsQuery } from '~root/core/wallets/state';
import { WalletsAccountsService } from '~root/core/wallets/services/wallets-accounts.service';
import { combineLatest, pipe, Subject } from 'rxjs';
import { ReceiveFundsComponent } from '~root/modules/wallet/components/receive-funds/receive-funds.component';
import { IWalletsAccountUI } from '~root/core/wallets/state/wallets-accounts.store';

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.scss']
})
export class WalletComponent implements OnInit {
  selectedAccount$: Observable<IWalletsAccount> = this.walletsAccountsQuery.getSelectedAccount$;
  accountCreated$: Observable<boolean> = this.selectedAccount$.pipe(pluck('isCreated'));
  requestingAccount$: Observable<IWalletsAccountUI['requesting']> = this.selectedAccount$
    .pipe(switchMap(account => this.walletsAccountsQuery.getRequestingStatus(account._id)));

  showLoading$: Observable<boolean> = combineLatest([
    this.accountCreated$,
    this.requestingAccount$
  ])
    .pipe(map(([accountCreated, requestingAccount]) => !accountCreated && !!requestingAccount));

  constructor(
    private readonly route: ActivatedRoute,
    private readonly modalsService: ModalsService,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly walletsAccountsService: WalletsAccountsService,
  ) { }

  ngOnInit(): void {
    this.selectedAccount$
      .pipe(take(1))
      .pipe(exhaustMap(account => this.walletsAccountsService.getAccountData(account._id)))
      .subscribe();
  }

  openReceiveFundsModal(): void {
    this.modalsService.open({ component: ReceiveFundsComponent });
  }

}

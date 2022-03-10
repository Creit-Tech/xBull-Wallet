import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { exhaustMap, map, pluck, switchMap, take, withLatestFrom } from 'rxjs/operators';
import { HorizonApisQuery, IWalletsAccount, WalletsAccountsQuery } from '~root/state';
import { WalletsAccountsService } from '~root/core/wallets/services/wallets-accounts.service';
import { combineLatest, Observable, pipe, Subject } from 'rxjs';
import { ReceiveFundsComponent } from '~root/modules/wallet/components/receive-funds/receive-funds.component';
import { IWalletsAccountUI } from '~root/state/wallets-accounts.store';
import { NzDrawerService } from 'ng-zorro-antd/drawer';

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
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly walletsAccountsService: WalletsAccountsService,
    private readonly horizonApiQuery: HorizonApisQuery,
    private readonly nzDrawerService: NzDrawerService,
  ) { }

  ngOnInit(): void {
    this.selectedAccount$
      .pipe(take(1))
      .pipe(withLatestFrom(this.horizonApiQuery.getSelectedHorizonApi$))
      .pipe(exhaustMap(([account, horizonApi]) => this.walletsAccountsService.getAccountData({
        account,
        horizonApi
      })))
      .subscribe();
  }

  openReceiveFundsModal(): void {
    const drawerRef = this.nzDrawerService.create<ReceiveFundsComponent>({
      nzContent: ReceiveFundsComponent,
      nzHeight: 'auto',
      nzPlacement: 'bottom',
    });

    drawerRef.open();
  }

}

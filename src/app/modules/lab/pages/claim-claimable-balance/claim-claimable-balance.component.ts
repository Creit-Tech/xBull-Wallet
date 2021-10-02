import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {ClaimableBalancesQuery, HorizonApisQuery, SettingsQuery, WalletsAccountsQuery} from '~root/state';
import {
  catchError,
  distinctUntilKeyChanged,
  map,
  pluck,
  switchMap,
  take,
  takeUntil,
  tap,
  withLatestFrom
} from 'rxjs/operators';
import { Server, ServerApi } from 'stellar-sdk';
import { BehaviorSubject, combineLatest, of, Subject } from 'rxjs';
import { ComponentCreatorService } from '~root/core/services/component-creator.service';
import { ClaimableBalanceDetailsComponent } from '~root/modules/lab/components/claimable-balance-details/claimable-balance-details.component';
import { ToastrService } from '~root/shared/toastr/toastr.service';
import { ClaimableBalancesService } from '~root/core/services/claimable-balances.service';

@Component({
  selector: 'app-claim-claimable-balance',
  templateUrl: './claim-claimable-balance.component.html',
  styleUrls: ['./claim-claimable-balance.component.scss']
})
export class ClaimClaimableBalanceComponent implements AfterViewInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();

  getBalances$: Subject<void> = new Subject<void>();

  gettingClaimableBalances$ = this.claimableBalancesQuery.gettingClaimableBalances$;

  selectedAccount$ = this.walletsAccountsQuery.getSelectedAccount$
    .pipe(distinctUntilKeyChanged('_id'));

  antiSpamClaimableAssets$ = this.settingsQuery.antiSpamClaimableAssets$;

  claimableBalances$ = this.getBalances$
    .pipe(switchMap(() => this.selectedAccount$))
    .pipe(switchMap((selectedAccount) => {
      return this.claimableBalancesService.getClaimableBalancesForClaimant(selectedAccount.publicKey);
    }))
    .pipe(pluck('records'))
    .pipe(withLatestFrom(this.antiSpamClaimableAssets$))
    .pipe(map(([records, blockedAssets]) => {
      return records.filter(record => !blockedAssets.find(blockedAsset => blockedAsset === record.asset));
    }))
    .pipe(catchError(error => {
      console.error(error);
      this.toastrService.open({
        status: 'error',
        message: `Please check you have internet and the Horizon API you're using is the correct one.`,
        title: `Can't retrieve the records.`
      });

      return of([]);
    }));

  constructor(
    private readonly router: Router,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly componentCreatorService: ComponentCreatorService,
    private readonly toastrService: ToastrService,
    private readonly claimableBalancesQuery: ClaimableBalancesQuery,
    private readonly claimableBalancesService: ClaimableBalancesService,
    private readonly settingsQuery: SettingsQuery,
  ) { }

  ngAfterViewInit(): void {
    this.getBalances$.next();
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  async onItemClick(balance: ServerApi.ClaimableBalanceRecord): Promise<void> {
    const ref = await this.componentCreatorService.createOnBody<ClaimableBalanceDetailsComponent>(ClaimableBalanceDetailsComponent);

    ref.component.instance.claimableBalanceRecord = balance;

    ref.component.instance.deny
      .asObservable()
      .pipe(take(1))
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(() => {
        ref.close();
      });

    ref.component.instance.accept
      .asObservable()
      .pipe(take(1))
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(() => {
        this.getBalances$.next();
        ref.close();
      });

    ref.open();
  }

  onBack(): void {
    this.router.navigate(['/lab']);
  }

  assetToText(asset: string): string {
    return asset === 'native'
      ? 'XLM'
      : asset.split(':')[0];
  }

}

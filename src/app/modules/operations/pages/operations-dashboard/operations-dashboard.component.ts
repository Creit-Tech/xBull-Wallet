import { Component, OnDestroy, OnInit } from '@angular/core';
import { combineLatest, Observable, Subject, Subscription } from 'rxjs';
import {
  HorizonApisQuery,
  IWalletsOperation,
  SettingsQuery,
  WalletsAccountsQuery,
  WalletsOperationsQuery
} from '~root/state';
import { UntypedFormControl, Validators } from '@angular/forms';
import {
  debounceTime,
  distinctUntilKeyChanged,
  filter, map,
  startWith,
  switchMap, take,
  takeUntil,
  withLatestFrom
} from 'rxjs/operators';
import { WalletsAccountsService } from '~root/core/wallets/services/wallets-accounts.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Networks } from 'stellar-base';
import { GlobalsService } from '~root/lib/globals/globals.service';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import {
  OperationDetailsComponent
} from '~root/modules/operations/components/operation-details/operation-details.component';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-operations-dashboard',
  templateUrl: './operations-dashboard.component.html',
  styleUrls: ['./operations-dashboard.component.scss']
})
export class OperationsDashboardComponent implements OnInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();

  gettingAccountsOperations$ = this.walletsOperationsQuery.gettingAccountsOperations$;

  selectedAccount$ = this.walletsAccountsQuery.getSelectedAccount$;
  accountOperations$: Observable<IWalletsOperation[]> = this.selectedAccount$
    .pipe(filter(account => !!account))
    .pipe(distinctUntilKeyChanged('_id'))
    .pipe(withLatestFrom(this.settingsQuery.antiSpamPublicKeys$))
    .pipe(switchMap(([account, antiSpamPublicKeys]) => {
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

  typeOfOperationsControl: UntypedFormControl = new UntypedFormControl('only_payments', Validators.required);

  constructor(
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly horizonApisQuery: HorizonApisQuery,
    private readonly walletsAccountsService: WalletsAccountsService,
    private readonly nzMessageService: NzMessageService,
    private readonly walletsOperationsQuery: WalletsOperationsQuery,
    private readonly settingsQuery: SettingsQuery,
    private readonly globalsService: GlobalsService,
    private readonly nzDrawerService: NzDrawerService,
    private readonly translateService: TranslateService,
  ) { }

  getLatestOperationsSubscription: Subscription = this.typeOfOperationsControl.valueChanges
    .pipe(startWith('only_payments'))
    .pipe(switchMap(_ => {
      return combineLatest([
        this.selectedAccount$.pipe(distinctUntilKeyChanged('_id')),
        this.horizonApisQuery.getSelectedHorizonApi$.pipe(distinctUntilKeyChanged('_id'))
      ]);
    }))
    .pipe(takeUntil(this.componentDestroyed$))
    .pipe(switchMap(([account, horizonApi]) => {
      return this.walletsAccountsService.getLatestAccountOperations({
        account,
        horizonApi,
        onlyPayments: this.typeOfOperationsControl.value === 'only_payments',
      })
        .catch(_ => {
          this.nzMessageService.error('No operations available for this account in the Blockchain');
          return [];
        });
    }))
    .subscribe();

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  async onSelected(operation: IWalletsOperation): Promise<void> {
    this.nzDrawerService.create<OperationDetailsComponent>({
      nzContent: OperationDetailsComponent,
      nzTitle: this.translateService.instant('COMMON_WORDS.DETAILS'),
      nzCloseOnNavigation: true,
      nzWrapClassName: 'drawer-full-w-320 ios-safe-y',
      nzContentParams: { operation }
    });
  }

  async checkOnBlockchain(): Promise<void> {
    const selectedHorizonApi = await this.horizonApisQuery.getSelectedHorizonApi$.pipe(take(1))
      .toPromise();

    const selectedAccount = await this.selectedAccount$.pipe(take(1))
      .toPromise();

    const network = selectedHorizonApi.networkPassphrase === Networks.PUBLIC
      ? 'public'
      : 'testnet';

    // TODO: This needs to be dynamic
    this.globalsService.window.open(
      `https://stellar.expert/explorer/${network}/account/${selectedAccount.publicKey}`,
      '_blank'
    );
  }



}

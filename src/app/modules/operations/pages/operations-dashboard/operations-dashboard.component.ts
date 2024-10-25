import { Component, DestroyRef, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, firstValueFrom, Observable, Subject, Subscription, switchMap } from 'rxjs';
import {
  HorizonApisQuery,
  IWalletsOperation,
  WalletsAccountsQuery,
} from '~root/state';
import {
  distinctUntilKeyChanged,
  filter, map,
} from 'rxjs/operators';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Horizon, Networks } from '@stellar/stellar-sdk';
import { GlobalsService } from '~root/lib/globals/globals.service';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import {
  OperationDetailsComponent
} from '~root/modules/operations/components/operation-details/operation-details.component';
import { TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';

@Component({
  selector: 'app-operations-dashboard',
  templateUrl: './operations-dashboard.component.html',
  styleUrls: ['./operations-dashboard.component.scss']
})
export class OperationsDashboardComponent implements OnInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();

  fetchingData: boolean = false;
  hideSpam$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);

  operationRecords$: BehaviorSubject<IOperationRecord[]> = new BehaviorSubject<IOperationRecord[]>([]);
  filteredOperationRecords$: Observable<IOperationRecord[]> = this.hideSpam$.asObservable()
    .pipe(switchMap(hideSpam => {
      return this.operationRecords$
        .pipe(map(operationsRecords => {
          return operationsRecords.filter(op => {
            if (!hideSpam) return true;
            if (op.recordType !== 'account_credited' || op.asset !== 'native') return true;
            if (op.debit < 0.0025) return false
            return false;
          });
        }))
    }))
  selectedAccount$ = this.walletsAccountsQuery.getSelectedAccount$;

  constructor(
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly horizonApisQuery: HorizonApisQuery,
    private readonly nzMessageService: NzMessageService,
    private readonly globalsService: GlobalsService,
    private readonly nzDrawerService: NzDrawerService,
    private readonly translateService: TranslateService,
    private readonly stellarSdkService: StellarSdkService,
    private readonly destroyRef: DestroyRef,
  ) {
  }

  fetchInitialRecordsSubscription: Subscription = combineLatest([
    this.selectedAccount$.pipe(distinctUntilKeyChanged('_id')),
    this.horizonApisQuery.getSelectedHorizonApi$.pipe(distinctUntilKeyChanged('_id')),
  ])
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(async ([ selectedAccount, horizonApi ]) => {
      if (!selectedAccount || !horizonApi) {
        this.operationRecords$.next([]);
      } else {
        this.fetchingData = true;
        try {
          const server = this.stellarSdkService.selectServer(horizonApi.url);
          let response = await server.effects()
            .forAccount(selectedAccount.publicKey)
            .order('desc')
            .limit(200)
            .call();

          let parsedRecords: IOperationRecord[] = this.parseEffects(response);
          while (response.records.length > 0 && parsedRecords.length < 200) {
            parsedRecords = [ ...parsedRecords, ...this.parseEffects(response) ];
            response = await response.next();
          }

          this.operationRecords$.next(parsedRecords);
        } catch (e) {
          this.nzMessageService.error('Failed when fetching the data from Horizon.');
        }
        this.fetchingData = false;
      }
    });

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  async onSelected(effectId: string): Promise<void> {
    const horizonApi = await firstValueFrom(this.horizonApisQuery.getSelectedHorizonApi$);
    const selectedAccount = await firstValueFrom(this.walletsAccountsQuery.getSelectedAccount$);
    const server = this.stellarSdkService.selectServer(horizonApi.url);
    this.fetchingData = true;
    try {
      const operation = await server.operations().operation(effectId.split('-')[0]).call();

      this.nzDrawerService.create<OperationDetailsComponent>({
        nzContent: OperationDetailsComponent,
        nzTitle: this.translateService.instant('COMMON_WORDS.DETAILS'),
        nzCloseOnNavigation: true,
        nzWrapClassName: 'drawer-full-w-340 ios-safe-y',
        nzContentParams: {
          operation: {
            _id: operation.id,
            createdAt: new Date(operation.created_at).getTime(),
            operationRecord: operation,
            pagingToken: operation.paging_token,
            ownerAccount: selectedAccount._id,
            ownerPublicKey: selectedAccount.publicKey,
          }
        }
      });
    } catch (e) {
      this.nzMessageService.error('Error while fetching the operation data.');
    }
    this.fetchingData = false;
  }

  async checkOnBlockchain(): Promise<void> {
    const selectedHorizonApi = await firstValueFrom(this.horizonApisQuery.getSelectedHorizonApi$);

    const selectedAccount = await firstValueFrom(this.selectedAccount$);

    const network = selectedHorizonApi.networkPassphrase === Networks.PUBLIC
      ? 'public'
      : 'testnet';

    // TODO: This needs to be dynamic
    this.globalsService.window.open(
      `https://stellar.expert/explorer/${ network }/account/${ selectedAccount.publicKey }`,
      '_blank'
    );
  }

  parseEffects(response: Horizon.ServerApi.CollectionPage<Horizon.ServerApi.EffectRecord>): IOperationRecord[] {
    const parsedRecords: IOperationRecord[] = [];
    for (const record of response.records) {
      switch (record.type) {
        case 'account_created':
          parsedRecords.push({
            dateNumber: new Date(record.created_at).getTime(),
            date: new Date(record.created_at),
            recordId: record.id,
            recordType: 'account_created',
            asset: 'native',
            debit: Number((record as any).starting_balance),
            credit: 0,
          });
          break;

        case 'account_debited':
        case 'account_credited':
          parsedRecords.push({
            dateNumber: new Date(record.created_at).getTime(),
            date: new Date(record.created_at),
            recordId: record.id,
            recordType: record.type as 'account_debited' | 'account_credited',
            asset: (record as any).asset_type === 'native'
              ? 'native'
              : `${(record as any).asset_code}:${(record as any).asset_issuer}`,
            debit: record.type === 'account_debited' ? 0 : Number((record as any).amount),
            credit: record.type === 'account_credited' ? 0 : Number((record as any).amount),
          });
          break;
      }
    }
    return parsedRecords;
  }
}

export interface IOperationRecord {
  asset: string;
  debit: number;
  credit: number;
  date: Date;
  recordId: string;
  recordType: 'account_created' | 'account_debited' | 'account_credited';
  dateNumber: number;
}

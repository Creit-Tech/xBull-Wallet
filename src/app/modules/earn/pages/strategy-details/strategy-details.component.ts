import { Component, OnDestroy, OnInit } from '@angular/core';
import { Color, ScaleType } from '@swimlane/ngx-charts';
import { ActivatedRoute } from '@angular/router';
import { EarnStrategiesQuery } from '~root/modules/earn/state/strategies/earn-strategies.query';
import {
  catchError,
  concatAll,
  debounceTime,
  distinctUntilKeyChanged,
  map,
  switchMap,
  take,
  takeUntil
} from 'rxjs/operators';
import { EarnStrategiesService } from '~root/modules/earn/services/earn-strategies.service';
import { asapScheduler, BehaviorSubject, combineLatest, of, scheduled, Subject, Subscription, timer } from 'rxjs';
import BigNumber from 'bignumber.js';
import { WalletsAccountsQuery } from '~root/state';
import { FormControl, Validators } from '@angular/forms';
import { EarnVaultsService, IConfirmVaultCreationParams } from '~root/modules/earn/state/vaults/earn-vaults.service';
import { EarnVaultsQuery } from '~root/modules/earn/state/vaults/earn-vaults.query';
import { IEarnVault, VaultStatus } from '~root/modules/earn/state/vaults/earn-vault.model';
import { NzMessageService } from 'ng-zorro-antd/message';
import { XdrSignerComponent } from '~root/shared/modals/components/xdr-signer/xdr-signer.component';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import { NzModalService } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-strategy-details',
  templateUrl: './strategy-details.component.html',
  styleUrls: ['./strategy-details.component.scss']
})
export class StrategyDetailsComponent implements OnInit, OnDestroy {
  componentDestroyed$ = new Subject<void>();

  graphFilterControl = new FormControl('apr', [Validators.required]);
  graphFilter$: BehaviorSubject<'apr' | 'tvl' | 'tokenPrice'> = new BehaviorSubject<'apr' | 'tvl' | 'tokenPrice'>('apr');
  results$: BehaviorSubject<IGraphResult[]> = new BehaviorSubject<IGraphResult[]>([]);
  graphColors: Color = {
    name: 'xbull',
    selectable: true,
    domain: ['#C19CFC', '#9977D3', '#7354AC', '#4E3286', '#281262'],
    group: ScaleType.Linear,
  };

  strategyId$ = this.route.params.pipe(map(params => params.strategyId));
  strategy$ = this.strategyId$
    .pipe(switchMap(strategyId => {
      return this.earnStrategiesQuery.selectAll({
        filterBy: entity => entity._id === strategyId
      });
    }))
    .pipe(map(results => results[0]));

  vault$ = this.strategyId$
    .pipe(switchMap(strategyId => {
      return this.selectedAccount$
        .pipe(distinctUntilKeyChanged('_id'))
        .pipe(switchMap(selectedAccount => {
          return this.earnVaultsQuery.selectAll({
            filterBy: entity => entity.strategyId === strategyId
              && entity.depositorPublicKey === selectedAccount.publicKey
              && entity.status !== VaultStatus.CANCELLED,
          });
        }));
    }))
    .pipe(map(results => results[0]));

  creatingVault$ = this.earnVaultsQuery.creatingVault$;

  selectedAccount$ = this.walletsAccountsQuery.getSelectedAccount$;
  position$ = combineLatest([
    this.strategy$,
    this.selectedAccount$,
  ])
    .pipe(debounceTime(100))
    .pipe(map(([strategy, selectedAccount]) => {
      if (!strategy || !selectedAccount.accountRecord) {
        return { amount: 0, shares: 0 };
      }

      const tokenBalance = selectedAccount.accountRecord.balances.find(b => {
        return (
          (b.asset_type === 'credit_alphanum4' || b.asset_type === 'credit_alphanum12')
          && b.asset_code === strategy.pointerAssetCode
          && b.asset_issuer === strategy.contractAccount
        );
      });

      return {
        amount: new BigNumber(tokenBalance?.balance || 0)
          .multipliedBy(strategy.tokenPrice)
          .toNumber(),
        shares: tokenBalance?.balance || 0
      };
    }));

  fetchUpdatedSnapshots: Subscription = timer(0, 5000)
    .pipe(switchMap(_ => this.strategyId$))
    .pipe(switchMap(strategyId => {
      // TODO: make this easier to read
      return this.earnStrategiesService.getStrategySnapshots(strategyId)
        .pipe(switchMap(snapshots => {
          return scheduled([of(this.graphFilterControl.value), this.graphFilterControl.valueChanges], asapScheduler)
            .pipe(concatAll())
            .pipe(map(filter => {
              return [{
                name: filter,
                series: snapshots.map(item => {
                  let targetValue: number;
                  switch (filter) {
                    case 'tokenPrice':
                      targetValue = item.tokenPrice;
                      break;

                    case 'apr':
                      targetValue = item.apr * 100;
                      break;

                    case 'tvl':
                      targetValue = item.tvl;
                      break;

                    default:
                      targetValue = 0;
                  }

                  return { name: new Date(item.datePeriod), value: targetValue || 0 };
                })
              }];
            }));
        }))
        .pipe(catchError(err => {
          return of([]);
        }));
    }))
    .pipe(takeUntil(this.componentDestroyed$))
    .subscribe((value: any) => {
      if (value.length > 0) {
        this.results$.next(value);
      }
    }); // TODO: review this type 'any'

  constructor(
    private readonly route: ActivatedRoute,
    private readonly earnStrategiesQuery: EarnStrategiesQuery,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly earnStrategiesService: EarnStrategiesService,
    private readonly earnVaultsService: EarnVaultsService,
    private readonly earnVaultsQuery: EarnVaultsQuery,
    private readonly nzMessageService: NzMessageService,
    private readonly nzDrawerService: NzDrawerService,
    private readonly nzModalService: NzModalService,
  ) { }

  ngOnInit(): void {
    this.strategyId$
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(strategyId => {
        this.earnStrategiesService.getStrategyDetails(strategyId)
          .subscribe();
      });


    timer(0, 10000)
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(() => {
        this.earnVaultsService.getVaults()
          .subscribe();
      });
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  async createOrConfirmVault(): Promise<void> {
    let baseXDR: string;
    let vaultId: IEarnVault['_id'];
    const strategy = await this.strategy$.pipe(take(1)).toPromise();
    const vault = await this.vault$.pipe(take(1)).toPromise();

    if (!vault || vault.status === VaultStatus.CANCELLED) {
      try {
        const response = await this.earnVaultsService.createVault(
          strategy._id,
        ).pipe(take(1)).toPromise();

        baseXDR = response.creationXDR;
        vaultId = response._id;
      } catch (e) {
        this.nzModalService.error({
          nzContent: 'Vault creation was not possible, contact support. (code: SD-1746664)'
        });
        return;
      }
    } else {
      baseXDR = vault.creationXDR;
      vaultId = vault._id;
    }

    const drawerRef = this.nzDrawerService.create<XdrSignerComponent>({
      nzContent: XdrSignerComponent,
      nzContentParams: {
        xdr: baseXDR,
        signingResultsHandler: data => {
          this.confirmVaultCreation({
            vaultId,
            baseXDR,
            signers: data.signers
          });
          drawerRef.close();
        },
      },
      nzTitle: 'Confirm creation of the vault',
      nzWrapClassName: 'drawer-full-w-320 ios-safe-y',
    });
  }

  confirmVaultCreation(params: IConfirmVaultCreationParams): void {
    const messageId = this.nzMessageService.loading(
      'Confirming Vault creation...',
      { nzDuration: 0 }
    ).messageId;
    this.earnVaultsService.confirmVaultCreation(params)
      .subscribe({
        next: value => {
          this.nzMessageService.remove(messageId);
          this.nzMessageService.success('Vault confirmed, you can now use it to yield farm in the network');
        },
        error: err => {
          this.earnVaultsService.getVault(params.vaultId).subscribe();
          this.nzMessageService.remove(messageId);
          this.nzModalService.error({
            nzContent:
              'Vault creation failed because it was rejected by the network, make sure your account meets the initial requirements',
          });
        },
      });
  }

}

export interface IGraphResult {
  name: string;
  series: Array<{
    value: number;
    name: Date;
  }>;
}

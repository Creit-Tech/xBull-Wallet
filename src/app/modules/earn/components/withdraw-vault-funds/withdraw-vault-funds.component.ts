import { Component, Inject, Input, OnInit } from '@angular/core';
import { combineLatest, ReplaySubject } from 'rxjs';
import { IEarnStrategy } from '~root/modules/earn/state/strategies/earn-strategy.model';
import { IEarnVault, IEarnVaultTransaction } from '~root/modules/earn/state/vaults/earn-vault.model';
import { NzMarks } from 'ng-zorro-antd/slider';
import { FormControl, Validators } from '@angular/forms';
import { ENV, environment } from '~env';
import { map, switchMap, take, withLatestFrom } from 'rxjs/operators';
import BigNumber from 'bignumber.js';
import { EarnVaultsQuery } from '~root/modules/earn/state/vaults/earn-vaults.query';
import { EarnVaultsService, IConfirmVaultTransactionParams } from '~root/modules/earn/state/vaults/earn-vaults.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ErrorParserService } from '~root/lib/error-parser/error-parser.service';
import { XdrSignerComponent } from '~root/shared/modals/components/xdr-signer/xdr-signer.component';
import { NzDrawerService } from 'ng-zorro-antd/drawer';

@Component({
  selector: 'app-withdraw-vault-funds',
  templateUrl: './withdraw-vault-funds.component.html',
  styleUrls: ['./withdraw-vault-funds.component.scss']
})
export class WithdrawVaultFundsComponent implements OnInit {
  creatingWithdrawal$ = this.earnVaultsQuery.creatingWithdrawal$;
  confirmingTransaction$ = this.earnVaultsQuery.confirmingTransaction$;

  strategy$: ReplaySubject<IEarnStrategy> = new ReplaySubject<IEarnStrategy>();
  @Input() set strategy(data: IEarnStrategy) {
    this.strategy$.next(data);
  }

  vault$: ReplaySubject<IEarnVault> = new ReplaySubject<IEarnVault>();
  @Input() set vault(data: IEarnVault) {
    this.vault$.next(data);
  }

  tvl$ = this.vault$.pipe(map(vault => vault?.tvl || 0));

  feeToPay$ = combineLatest([
    this.strategy$,
    this.vault$
  ])
    .pipe(map(([strategy, vault]) => {
      return new BigNumber(vault.tvl)
        .multipliedBy(strategy.withdrawFee)
        .toFixed(7);
    }));

  constructor(
    @Inject(ENV)
    private readonly env: typeof environment,
    private readonly earnVaultsQuery: EarnVaultsQuery,
    private readonly earnVaultsService: EarnVaultsService,
    private readonly nzMessageService: NzMessageService,
    private readonly errorParserService: ErrorParserService,
    private readonly nzDrawerService: NzDrawerService,
  ) { }

  ngOnInit(): void {
  }

  async createWithdrawal(): Promise<void> {
    const [
      strategy,
      vault,
    ] = await Promise.all([
      this.strategy$.pipe(take(1)).toPromise(),
      this.vault$.pipe(take(1)).toPromise(),
    ]);

    if (
      !strategy
      || !vault
    ) { return; }

    let newVaultTransaction: IEarnVaultTransaction;
    try {
      newVaultTransaction = await this.earnVaultsService.createVaultWithdrawalTransaction({
        vaultId: vault._id,
      }).pipe(take(1)).toPromise();
    } catch (e) {
      this.nzMessageService.error(
        this.errorParserService.parseCTApiResponse(e),
        {nzDuration: 5000}
      );
      return;
    }

    const drawerRef = this.nzDrawerService.create<XdrSignerComponent>({
      nzContent: XdrSignerComponent,
      nzTitle: 'Sign transaction',
      nzWrapClassName: 'drawer-full-w-320 ios-safe-y',
      nzContentParams: {
        xdr: newVaultTransaction.baseXDR,
        signingResultsHandler: data => {
          this.confirmVaultTransaction({
            signers: data.signers,
            baseXDR: data.baseXDR,
            vaultId: vault._id,
            vaultTransactionId: newVaultTransaction._id,
          });
          drawerRef.close();
        },
      }
    });
  }

  async confirmVaultTransaction(data: IConfirmVaultTransactionParams): Promise<void> {
    const messageId = this.nzMessageService.loading(
      'Confirming Vault withdraw...',
      { nzDuration: 0 }
    ).messageId;

    this.earnVaultsService.confirmVaultTransaction(data)
      .subscribe({
        next: value => {
          this.nzMessageService.remove(messageId);
          this.nzMessageService.success('Funds removed from the Vault');

          this.earnVaultsService.getVault(data.vaultId)
            .subscribe();
        },
        error: err => {
          this.nzMessageService.remove(messageId);
          this.nzMessageService.error(
            this.errorParserService.parseCTApiResponse(err),
            { nzDuration: 5000 }
          );
        }
      });
  }

}

import { Component, Input, OnInit } from '@angular/core';
import { IEarnStrategy } from '~root/modules/earn/state/strategies/earn-strategy.model';
import { BehaviorSubject, combineLatest, Observable, ReplaySubject } from 'rxjs';
import { FormControl, Validators } from '@angular/forms';
import { WalletsAccountsQuery } from '~root/state';
import { map, take } from 'rxjs/operators';
import { Horizon } from 'stellar-sdk';
import BalanceLineAsset = Horizon.BalanceLineAsset;
import { NzMessageService } from 'ng-zorro-antd/message';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import BigNumber from 'bignumber.js';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import { XdrSignerComponent } from '~root/shared/modals/components/xdr-signer/xdr-signer.component';
import { EarnVaultsService, IConfirmVaultDepositParams } from '~root/modules/earn/state/vaults/earn-vaults.service';
import { IEarnVault, IEarnVaultDeposit } from '~root/modules/earn/state/vaults/earn-vault.model';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorParserService } from '~root/lib/error-parser/error-parser.service';
import { EarnVaultsQuery } from '~root/modules/earn/state/vaults/earn-vaults.query';

@Component({
  selector: 'app-deposit-vault-funds',
  templateUrl: './deposit-vault-funds.component.html',
  styleUrls: ['./deposit-vault-funds.component.scss']
})
export class DepositVaultFundsComponent implements OnInit {
  creatingDeposit$ = this.earnVaultsQuery.creatingDeposit$;

  strategy$: ReplaySubject<IEarnStrategy> = new ReplaySubject<IEarnStrategy>();
  @Input() set strategy(data: IEarnStrategy) {
    this.strategy$.next(data);
  }

  vault$: ReplaySubject<IEarnVault> = new ReplaySubject<IEarnVault>();
  @Input() set vault(data: IEarnVault) {
    this.vault$.next(data);
  }

  depositAmountControl: FormControl = new FormControl(0, [
    Validators.required,
    Validators.min(1),
  ]);

  selectedAccount$ = this.walletsAccountsQuery.getSelectedAccount$;

  acceptedAssetBalance$: Observable<BalanceLineAsset | undefined> = combineLatest([
    this.selectedAccount$,
    this.strategy$,
  ])
    .pipe(map(([selectedAccount, strategy]) => {
      if (!selectedAccount || !strategy) {
        return undefined;
      }

      return selectedAccount.accountRecord?.balances.find((b) => {
        return (
          (b.asset_type === 'credit_alphanum4' || b.asset_type === 'credit_alphanum12')
          && b.asset_code === strategy.assetCodeAccepted
          && b.asset_issuer === strategy.assetIssuerAccepted
        );
      }) as BalanceLineAsset | undefined;
    }));

  constructor(
    private readonly stellarSdkService: StellarSdkService,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly nzMessageService: NzMessageService,
    private readonly nzDrawerService: NzDrawerService,
    private readonly earnVaultsService: EarnVaultsService,
    private readonly earnVaultsQuery: EarnVaultsQuery,
    private readonly errorParserService: ErrorParserService,
  ) {}

  ngOnInit(): void {
  }

  setMaxValue(): void {
    this.acceptedAssetBalance$
      .pipe(take(1))
      .subscribe(data => {
        this.depositAmountControl.setValue(data?.balance || 0);
      });
  }

  async createDeposit(): Promise<void> {
    const [
      strategy,
      acceptedAssetBalance,
      selectedAccount,
      vault,
    ] = await Promise.all([
      this.strategy$.pipe(take(1)).toPromise(),
      this.acceptedAssetBalance$.pipe(take(1)).toPromise(),
      this.selectedAccount$.pipe(take(1)).toPromise(),
      this.vault$.pipe(take(1)).toPromise(),
    ]);

    if (
      !acceptedAssetBalance
      || !selectedAccount
      || !selectedAccount.accountRecord
      || !strategy
      || !vault
    ) { return; }

    let newVaultDeposit: IEarnVaultDeposit;
    try {
      newVaultDeposit = await this.earnVaultsService.createVaultDeposit({
        vaultId: vault._id,
        amount: this.depositAmountControl.value,
      }).pipe(take(1)).toPromise();
    } catch (e) {
      this.nzMessageService.error(
        this.errorParserService.parseCTApiResponse(e),
        { nzDuration: 5000 }
      );
      return;
    }

    const transaction = new this.stellarSdkService.SDK.Transaction(
      newVaultDeposit.baseXDR,
      this.stellarSdkService.networkPassphrase,
    );

    const drawerRef = this.nzDrawerService.create<XdrSignerComponent>({
      nzContent: XdrSignerComponent,
      nzTitle: 'Sign transaction',
      nzWrapClassName: 'drawer-full-w-320 ios-safe-y',
      nzContentParams: {
        xdr: newVaultDeposit.baseXDR,
        signingResultsHandler: data => {
          this.confirmVaultDeposit({
            signers: data.signers,
            baseXDR: data.baseXDR,
            vaultId: vault._id,
            vaultDepositId: newVaultDeposit._id,
          });
          drawerRef.close();
        },
      }
    });
  }

  async confirmVaultDeposit(data: IConfirmVaultDepositParams): Promise<void> {
    const messageId = this.nzMessageService.loading(
      'Confirming Vault deposit...',
      { nzDuration: 0 }
    ).messageId;

    this.earnVaultsService.confirmVaultDeposit(data)
      .subscribe({
        next: value => {
          this.nzMessageService.remove(messageId);
          this.nzMessageService.success('Funds deposited into the Vault');
          this.depositAmountControl.reset();
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

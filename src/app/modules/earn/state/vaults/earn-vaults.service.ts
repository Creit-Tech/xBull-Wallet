import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { EarnVaultsStore } from './earn-vaults.store';
import { ENV, environment } from '~env';
import { Observable, throwError } from 'rxjs';
import { createEarnVault, IEarnVault, IEarnVaultTransaction } from '~root/modules/earn/state/vaults/earn-vault.model';
import { catchError, map, tap } from 'rxjs/operators';
import { applyTransaction } from '@datorama/akita';

@Injectable()
export class EarnVaultsService {

  constructor(
    @Inject(ENV)
    private readonly env: typeof environment,
    private earnVaultsStore: EarnVaultsStore,
    private http: HttpClient
  ) {}

  getVaults(): Observable<IEarnVault[]> {
    this.earnVaultsStore.updateUIState({ requestingVaults: true });
    return this.http.get<{ vaults: IEarnVault[] }>(this.env.xPointersApi + '/vaults')
      .pipe(map(response => {
        const vaults = response.vaults.map(v => createEarnVault(v));
        applyTransaction(() => {
          this.earnVaultsStore.updateUIState({ requestingVaults: false });
          this.earnVaultsStore.upsertMany(vaults);
        });
        return vaults;
      }))
      .pipe(catchError(err => {
        this.earnVaultsStore.updateUIState({ requestingVaults: false });
        return throwError(err);
      }));
  }

  getVault(vaultId: IEarnVault['_id']): Observable<IEarnVault> {
    this.earnVaultsStore.updateUIState({ requestingVaults: true });
    return this.http.get<{ vault: IEarnVault }>(this.env.xPointersApi + '/vaults/' + vaultId)
      .pipe(map(response => {
        const vault = createEarnVault(response.vault);
        applyTransaction(() => {
          this.earnVaultsStore.updateUIState({ requestingVaults: false });
          this.earnVaultsStore.upsert(vault._id, vault);
        });
        return vault;
      }))
      .pipe(catchError(err => {
        this.earnVaultsStore.updateUIState({ requestingVaults: false });
        return throwError(err);
      }));
  }

  createVault(strategyId: IEarnVault['strategyId']): Observable<IEarnVault> {
    this.earnVaultsStore.updateUIState({ creatingVault: true });
    return this.http.post<ICreateVaultResponse>(this.env.xPointersApi + `/vaults`, { strategyId })
      .pipe(map((response) => {
        const vault = createEarnVault(response.vault);
        applyTransaction(() => {
          this.earnVaultsStore.upsert(vault._id, vault);
          this.earnVaultsStore.updateUIState({ creatingVault: false });
        });
        return vault;
      }))
      .pipe(catchError(err => {
        this.earnVaultsStore.updateUIState({ creatingVault: false });
        return throwError(err);
      }));
  }

  confirmVaultCreation(params: IConfirmVaultCreationParams): Observable<IEarnVault> {
    this.earnVaultsStore.updateUIState({ creatingVault: true });
    return this.http.post<IConfirmVaultCreationResponse>(
      this.env.xPointersApi + `/vaults/${params.vaultId}/confirm-creation`,
      { baseXDR: params.baseXDR, signers: params.signers }
    )
      .pipe(map((response) => {
        const vault = createEarnVault(response.vault);
        applyTransaction(() => {
          this.earnVaultsStore.upsert(vault._id, vault);
          this.earnVaultsStore.updateUIState({ creatingVault: false });
        });
        return vault;
      }))
      .pipe(catchError(err => {
        this.earnVaultsStore.updateUIState({ creatingVault: false });
        return throwError(err);
      }));
  }

  createVaultDepositTransaction(params: { vaultId: IEarnVault['_id']; amount: number }): Observable<IEarnVaultTransaction> {
    this.earnVaultsStore.updateUIState({ creatingDeposit: true });
    return this.http.get<{ vaultTransaction: IEarnVaultTransaction }>(
      this.env.xPointersApi + `/vaults/${params.vaultId}/create-deposit`,
      { params: { amount: params.amount } }
    )
      .pipe(map((response) => {
        this.earnVaultsStore.updateUIState({ creatingDeposit: false });
        return response.vaultTransaction;
      }))
      .pipe(catchError(err => {
        this.earnVaultsStore.updateUIState({ creatingDeposit: false });
        return throwError(err);
      }));
  }

  createVaultWithdrawalTransaction(params: { vaultId: IEarnVault['_id']; }): Observable<IEarnVaultTransaction> {
    this.earnVaultsStore.updateUIState({ creatingWithdrawal: true });
    return this.http.get<{ vaultTransaction: IEarnVaultTransaction }>(
      this.env.xPointersApi + `/vaults/${params.vaultId}/create-withdraw`,
    )
      .pipe(map((response) => {
        this.earnVaultsStore.updateUIState({ creatingWithdrawal: false });
        return response.vaultTransaction;
      }))
      .pipe(catchError(err => {
        this.earnVaultsStore.updateUIState({ creatingWithdrawal: false });
        return throwError(err);
      }));
  }

  confirmVaultTransaction(params: IConfirmVaultTransactionParams): Observable<IEarnVaultTransaction> {
    this.earnVaultsStore.updateUIState({ confirmingTransaction: true });
    return this.http.post<{ vaultTransaction: IEarnVaultTransaction }>(
      this.env.xPointersApi + `/vaults/${params.vaultId}/deposits/${params.vaultTransactionId}/confirm-transaction`,
      { baseXDR: params.baseXDR, signers: params.signers },
    )
      .pipe(map((response) => {
        this.earnVaultsStore.updateUIState({ confirmingTransaction: false });
        return response.vaultTransaction;
      }))
      .pipe(catchError(err => {
        this.earnVaultsStore.updateUIState({ confirmingTransaction: false });
        return throwError(err);
      }));
  }

}

export interface ICreateVaultResponse {
  vault: IEarnVault;
}

export interface IConfirmVaultCreationResponse extends ICreateVaultResponse {
  success: boolean;
}

export interface IConfirmVaultCreationParams {
  vaultId: string;
  baseXDR: string;
  signers: Array<{
    publicKey: string;
    signature: string;
  }>;
}

export interface IConfirmVaultTransactionParams {
  vaultId: IEarnVault['_id'];
  vaultTransactionId: IEarnVaultTransaction['_id'];
  baseXDR: string;
  signers: Array<{
    publicKey: string;
    signature: string;
  }>;
}

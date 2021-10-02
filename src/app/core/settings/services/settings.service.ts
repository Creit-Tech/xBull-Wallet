import { Injectable } from '@angular/core';
import { SettingsState, SettingsStore } from '~root/state';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import BigNumber from 'bignumber.js';
import { from, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  constructor(
    private readonly settingsStore: SettingsStore,
    private readonly stellarSdkService: StellarSdkService,
  ) { }

  setAdvanceModeStatus(status: SettingsState['advanceMode']): void {
    this.settingsStore.updateState({ advanceMode: status });
  }

  setDefaultFee(value: SettingsState['defaultFee']): void {
    this.settingsStore.updateState({ defaultFee: value });
  }

  getRecommendedFee(): Observable<BigNumber> {
    this.settingsStore.updateUIState({ gettingRecommendedFee: true });
    const promise = this.stellarSdkService.Server.feeStats();

    return from(promise)
      .pipe(map(({ last_ledger_base_fee }) => new BigNumber(last_ledger_base_fee)))
      .pipe(tap(() => this.settingsStore.updateUIState({ gettingRecommendedFee: false })))
      .pipe(catchError(error => {
        this.settingsStore.updateUIState({ gettingRecommendedFee: false });
        return throwError(error);
      }));
  }

  setOperationsToShow(data: SettingsState['operationTypesToShow']): void {
    this.settingsStore.updateState({
      operationTypesToShow: data,
    });
  }

  addPublicKeyToSpamFilter(publicKey: string): void {
    const state = this.settingsStore.getValue();

    if (state.antiSPAMPublicKeys.find(pk => pk === publicKey)) {
      throw new Error(`Public key is already registered`);
    }

    this.settingsStore.updateState({
      antiSPAMPublicKeys: [
        ...state.antiSPAMPublicKeys,
        publicKey,
      ],
    });
  }

  removePublicKeyFromSpamFilter(publicKey: string): void {
    const state = this.settingsStore.getValue();
    this.settingsStore.updateState({
      antiSPAMPublicKeys: state.antiSPAMPublicKeys
        .filter(pk => pk !== publicKey)
    });
  }

  addClaimableAssetToSpamFilter(targetAsset: string): void {
    const state = this.settingsStore.getValue();

    if (state.antiSPAMClaimableAssets.find(asset => asset === targetAsset)) {
      throw new Error(`Public key is already registered`);
    }

    this.settingsStore.updateState({
      antiSPAMClaimableAssets: [
        ...state.antiSPAMClaimableAssets,
        targetAsset
      ],
    });
  }

  removeClaimableAssetFromSpamFilter(targetAsset: string): void {
    const state = this.settingsStore.getValue();

    this.settingsStore.updateState({
      antiSPAMClaimableAssets: state.antiSPAMClaimableAssets
        .filter(asset => asset !== targetAsset)
    });
  }

  turnOnWindowsMode(): void {
    this.settingsStore.updateUIState({
      windowsMode: true,
    });
  }
}

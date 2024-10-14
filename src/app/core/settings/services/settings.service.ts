import { Injectable } from '@angular/core';
import { IWalletAssetModel, SettingsState, SettingsStore, WalletsAssetsStore } from '~root/state';
import { StellarSdkService } from '~root/gateways/stellar/stellar-sdk.service';
import BigNumber from 'bignumber.js';
import { from, Observable, Subject, Subscription, throwError, timer } from 'rxjs';
import { catchError, delay, filter, map, switchMap, tap } from 'rxjs/operators';
import { addMinutes } from 'date-fns';
import { applyTransaction } from '@datorama/akita';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  getKeptPassword: () => string | undefined;
  setKeptPassword: (password: string | undefined) => void;

  removeLocallySavedPasswordTrigger$: Subject<void> = new Subject<void>();

  constructor(
    private readonly settingsStore: SettingsStore,
    private readonly stellarSdkService: StellarSdkService,
    private readonly walletsAssetsStore: WalletsAssetsStore,
    private readonly translateService: TranslateService,
  ) {
    let keptPassword: string | undefined;
    this.getKeptPassword = () => {
      return keptPassword?.slice();
    };
    this.setKeptPassword = (password: string | undefined) => {
      if (!!password) {
      }
      keptPassword = password;

      if (!!password) {
        this.removeLocallySavedPasswordTrigger$.next();
      }
    };
  }

  removeLocallySavedPasswordSubscription: Subscription = this.removeLocallySavedPasswordTrigger$.asObservable()
    .pipe(filter(_ => this.settingsStore.getValue().keepPasswordActive))
    .pipe(switchMap(_ => {
      return timer(
        new BigNumber(this.settingsStore.getValue().timeoutPasswordSaved)
          .multipliedBy('60000')
          .toNumber()
      );
    }))
    .subscribe(_ => {
      this.setKeptPassword(undefined);
    });

  setDefaultFee(value: SettingsState['defaultFee']): void {
    this.settingsStore.updateState({ defaultFee: value });
  }

  setBlockBlindLedgerTransactionsStatus(status: SettingsState['blockBlindLedgerTransactions']): void {
    this.settingsStore.updateState({ blockBlindLedgerTransactions: status });
  }

  getRecommendedFee(): Observable<string> {
    this.settingsStore.updateUIState({ gettingRecommendedFee: true });

    return this.stellarSdkService.getRecommendedFee()
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

  enableKeepPasswordOption(): void {
    this.settingsStore.update(state => ({
      ...state,
      keepPasswordActive: true,
      lastTimePasswordSaved: new Date(),
      nextTimeToRemovePassword: addMinutes(new Date(), state.timeoutPasswordSaved),
    }));
  }

  disableKeepPasswordOption(): void {
    this.settingsStore.updateState({
      keepPasswordActive: false,
      lastTimePasswordSaved: undefined,
      nextTimeToRemovePassword: undefined,
    });
  }

  // timeout is measured in minutes IE 5, 15 or 30
  setKeptPasswordTimeout(timeout: number): void {
    this.settingsStore.updateState({ timeoutPasswordSaved: timeout });
    this.removeLocallySavedPasswordTrigger$.next();
  }

  addDeviceAuthToken(data: { passwordAuthTokenIdentifier: string; passwordAuthKey: string; }): void {
    this.settingsStore.updateState({
      passwordAuthTokenIdentifier: data.passwordAuthTokenIdentifier,
      passwordAuthTokenActive: true,
      passwordAuthKey: data.passwordAuthKey,
    });
  }

  removeDeviceAuthToken(): void {
    this.settingsStore.updateState({
      passwordAuthToken: undefined,
      passwordAuthTokenIdentifier: undefined,
      passwordAuthKey: undefined,
      passwordAuthTokenActive: false,
    });
  }

  updateBackgroundImage(data: Pick<SettingsState, 'backgroundImg' | 'backgroundCover'>): void {
    this.settingsStore.updateState(data);
  }

  setCounterAsset(assetId: IWalletAssetModel['_id']): void {
    applyTransaction(() => {
      this.walletsAssetsStore.update(null, {
        counterPrice: undefined,
        counterId: undefined
      });
      this.settingsStore.updateState({ counterAssetId: assetId });
    });
  }

  setSelectedLanguage(data: string): void {
    this.settingsStore.updateState({ selectedLanguage: data });
    this.translateService.use(data);
  }
}

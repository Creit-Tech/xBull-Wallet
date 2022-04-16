import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { SettingsStore, SettingsState } from './settings.store';

@Injectable({ providedIn: 'root' })
export class SettingsQuery extends Query<SettingsState> {
  gettingRecommendedFee$ = this.select(state => state.UIState.gettingRecommendedFee);

  advanceMode$ = this.select(state => state.advanceMode);
  defaultFee$ = this.select(state => state.defaultFee);

  antiSpamPublicKeys$ = this.select(state => state.antiSPAMPublicKeys);
  antiSpamClaimableAssets$ = this.select(state => state.antiSPAMClaimableAssets);
  operationTypesToShow$ = this.select(state => state.operationTypesToShow);

  keepPasswordActive$ = this.select(state => state.keepPasswordActive);
  lastTimePasswordSaved$ = this.select(state => state.lastTimePasswordSaved);
  timeoutPasswordSaved$ = this.select(state => state.timeoutPasswordSaved);

  passwordAuthTokenActive$ = this.select(state => state.passwordAuthTokenActive);
  passwordAuthToken$ = this.select(state => state.passwordAuthToken);
  passwordAuthKey$ = this.select(state => state.passwordAuthKey);
  passwordAuthTokenIdentifier$ = this.select(state => state.passwordAuthTokenIdentifier);

  backgroundImg$ = this.select(state => state.backgroundImg);
  backgroundCover$ = this.select(state => state.backgroundCover);

  counterAssetId$ = this.select(state => state.counterAssetId);

  constructor(protected store: SettingsStore) {
    super(store);
  }

}

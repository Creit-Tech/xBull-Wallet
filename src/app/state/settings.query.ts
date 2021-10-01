import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { SettingsStore, SettingsState } from './settings.store';

@Injectable({ providedIn: 'root' })
export class SettingsQuery extends Query<SettingsState> {
  gettingRecommendedFee$ = this.select(state => state.UIState.gettingRecommendedFee);

  advanceMode$ = this.select(state => state.advanceMode);
  defaultFee$ = this.select(state => state.defaultFee);

  antiSpam$ = this.select(state => state.antiSPAM);
  antiSpamClaimableAssets$ = this.select(state => state.antiSPAMClaimableAssets);
  operationTypesToShow$ = this.select(state => state.operationTypesToShow);

  constructor(protected store: SettingsStore) {
    super(store);
  }

}

import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';

export interface SettingsState {
  UIState: {
    windowsMode: boolean;
    gettingRecommendedFee: boolean;
  };
  advanceMode: boolean;
  defaultFee: string;

  antiSPAM: {
    publicKeys: string[];
    domains: string[];
    assets: Array<{
      assetCode: string;
      issuer: string;
    }>
  };

  // TODO: this should be Array<IWalletsOperation['operationRecord']['type']> but the types are getting issues, fix this later
  operationTypesToShow: string[];
}

export function createInitialState(): SettingsState {
  return {
    UIState: {
      windowsMode: false,
      gettingRecommendedFee: false,
    },
    advanceMode: false,
    defaultFee: '100',
    antiSPAM: {
      assets: [],
      domains: [],
      publicKeys: [],
    },
    operationTypesToShow: [
      'manage_sell_offer',
      'manage_buy_offer',
      'create_account',
      'payment',
      'path_payment_strict_send',
      'path_payment_strict_receive',
      'account_merge'
    ]
  };
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'settings' })
export class SettingsStore extends Store<SettingsState> {

  constructor() {
    super(createInitialState());
  }

  updateState(updatedState: Partial<Omit<SettingsState, 'UIState'>>): void {
    this.update(state => ({
      ...state,
      ...updatedState
    }));
  }

  updateUIState(updatedUIState: Partial<SettingsState['UIState']>): void {
    this.update(state => ({
      ...state,
      UIState: {
        ...state.UIState,
        ...updatedUIState
      }
    }));
  }

}

import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';

export interface SettingsState {
  UIState: {
    gettingRecommendedFee: boolean;
  };
  advanceMode: boolean;
  defaultFee: string;

  // TODO: this should be Array<IWalletsOperation['operationRecord']['type']> but the types are getting issues, fix this later
  operationTypesToShow: string[];
}

export function createInitialState(): SettingsState {
  return {
    UIState: {
      gettingRecommendedFee: false,
    },
    advanceMode: false,
    defaultFee: '100',
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

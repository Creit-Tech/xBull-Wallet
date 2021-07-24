import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';

export interface SettingsState {
  UIState: {
    gettingRecommendedFee: boolean;
  };
  advanceMode: boolean;
  defaultFee: string;
}

export function createInitialState(): SettingsState {
  return {
    UIState: {
      gettingRecommendedFee: false,
    },
    advanceMode: false,
    defaultFee: '100',
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
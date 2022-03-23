import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { IWalletAssetIssued, IWalletAssetNative } from '~root/state/wallets-asset.model';

export interface SettingsState {
  UIState: {
    windowsMode: boolean;
    gettingRecommendedFee: boolean;
  };
  storeVersion: number;

  advanceMode: boolean;
  defaultFee: string;

  // This is a token which is used to decode an encrypted password in mobile devices
  passwordAuthTokenActive: boolean;
  passwordAuthToken?: string;
  passwordAuthKey?: string;
  passwordAuthTokenIdentifier?: string;

  antiSPAMPublicKeys: string[];

  // The string follow the "CODE:ISSUER" style from the claimable balance endpoint
  antiSPAMClaimableAssets: string[];

  // TODO: this should be Array<IWalletsOperation['operationRecord']['type']> but the types are getting issues, fix this later
  operationTypesToShow: string[];

  // Background settings
  backgroundImg?: string;
  backgroundCover?: string;

  // Counter asset
  // This is to use an asset as the base price
  // Default values are USDC on both testnet and pubnet
  counterAssetId: IWalletAssetIssued['_id'] | IWalletAssetNative['_id'];
}

export function createInitialState(): SettingsState {
  return {
    UIState: {
      windowsMode: false,
      gettingRecommendedFee: false,
    },
    storeVersion: 2,
    advanceMode: false,
    defaultFee: '10000',
    passwordAuthTokenActive: false,
    antiSPAMPublicKeys: [],
    antiSPAMClaimableAssets: [],
    operationTypesToShow: [
      'create_account',
      'payment',
      'path_payment_strict_receive',
      'create_passive_sell_offer',
      'manage_sell_offer',
      'set_options',
      'change_trust',
      'allow_trust',
      'account_merge',
      'inflation',
      'manage_data',
      'bump_sequence',
      'manage_buy_offer',
      'path_payment_strict_send',
      'create_claimable_balance',
      'claim_claimable_balance',
      'begin_sponsoring_future_reserves',
      'end_sponsoring_future_reserves',
      'revoke_sponsorship',
      'clawback',
      'clawback_claimable_balance',
      'set_trust_line_flags',
      'liquidity_pool_deposit',
      'liquidity_pool_withdraw',
    ],
    counterAssetId: 'native',
  };
}

@Injectable({ providedIn: 'root' })
@StoreConfig({
  name: 'settings',
  resettable: true,
})
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

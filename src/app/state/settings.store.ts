import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { IWalletAssetModel } from '~root/state/wallets-asset.model';

export interface SettingsState {
  UIState: {
    windowsMode: boolean;
    gettingRecommendedFee: boolean;
  };

  selectedLanguage?: string;

  storeVersion: number;

  defaultFee: string;

  // keep password configurations, these are used to handle the logic
  // (it should never be used to save the password, password can't be inside the store for security reasons)
  keepPasswordActive: boolean;
  lastTimePasswordSaved?: Date;
  nextTimeToRemovePassword?: Date;
  timeoutPasswordSaved: number; // Minutes to keep the password saved before asking for it again

  // This is a token which is used to decode an encrypted password in mobile devices
  passwordAuthTokenActive: boolean;
  /**
   *  @deprecated
   */
  passwordAuthToken?: string;
  passwordAuthKey?: string;
  passwordAuthTokenIdentifier?: string;

  antiSPAMPublicKeys: string[];

  // The string follow the "CODE:ISSUER" style from the claimable balance endpoint
  antiSPAMClaimableAssets: string[];

  /**
   * @deprecated - We won't show operations anymore and instead we only focus on payments
   */
  // TODO: this should be Array<IWalletsOperation['operationRecord']['type']> but the types are getting issues, fix this later
  operationTypesToShow: string[];

  // Background settings
  backgroundImg?: string;
  backgroundCover?: string;

  // Counter asset
  // This is to use an asset as the base price
  // Default values are USDC on both testnet and pubnet
  counterAssetId: IWalletAssetModel['_id'];

  // Hardware wallet global configurations

  /**
   * Ledger allows blind signing transactions, the oldest model from ledger requires that the XDR string is lower than a certain amount of characters because otherwise it throws an error
   * If this is enabled, even those cases where xBull thinks a ledger device could fail it will still try a regular non-blind transaction
   */
  blockBlindLedgerTransactions: boolean;
}

export function createInitialState(): SettingsState {
  return {
    UIState: {
      windowsMode: false,
      gettingRecommendedFee: false,
    },
    storeVersion: 2,
    defaultFee: '10000',
    keepPasswordActive: false,
    timeoutPasswordSaved: 15,
    passwordAuthTokenActive: false,
    antiSPAMPublicKeys: [],
    antiSPAMClaimableAssets: [],
    operationTypesToShow: [
      'create_account',
      'payment',
      'manage_buy_offer',
      'manage_sell_offer',
      'create_passive_sell_offer',
      'set_options',
      'change_trust',
      'allow_trust',
      'account_merge',
      'inflation',
      'manage_data',
      'bump_sequence',
      'path_payment_strict_send',
      'path_payment_strict_receive',
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
    blockBlindLedgerTransactions: false,
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

import { SettingsState } from '~root/state';

export const settingsStoreMigration = (state: SettingsState) => {
  // If store is less than version 1, add the type 'with_secret_key' because they were the only kind we were using
  if (!state.storeVersion || state.storeVersion < 1) {
    if (state.passwordAuthTokenActive) {
      state.passwordAuthTokenActive = false;
      delete state.passwordAuthToken;
      delete state.passwordAuthKey;
      delete state.passwordAuthTokenIdentifier;
    }

    state.storeVersion = 1;
  }
};

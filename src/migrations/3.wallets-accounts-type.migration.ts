import { WalletsAccountsState } from '~root/state';

export const walletsAccountsStoreMigration = (state: WalletsAccountsState) => {
  // If store is less than version 1, add the type 'with_secret_key' because they were the only kind we were using
  if (!state.storeVersion || state.storeVersion < 1) {
    if (!!state.entities) {
      for (const entitiesKey in state.entities) {
        if (state.entities.hasOwnProperty(entitiesKey)) {
          state.entities[entitiesKey].type = 'with_secret_key';
          state.entities[entitiesKey].docVersion = 1;
        }
      }
    }

    state.storeVersion = 1;
  }
};

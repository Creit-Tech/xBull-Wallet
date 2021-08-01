import { WalletsOperationsState } from '~root/state';

export const walletsOperationsStoreMigration = (state: WalletsOperationsState) => {

  // If store is less than version 1, remove the entities and ids because we changed the model
  if (!state.storeVersion || state.storeVersion < 1) {
    delete state.entities;
    delete state.ids;
    state.storeVersion = 1;
  }

};

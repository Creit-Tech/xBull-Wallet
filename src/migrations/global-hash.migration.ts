import { WalletsState } from '~root/state';

export const globalHashMigration = (state: WalletsState) => {
  if (!state.storeVersion || state.storeVersion < 3) {
    (state as any).globalPasswordHash = undefined;
    state.passwordSet = !!Object
      .values(state.entities || {})
      .find(w => w.type === 'secret_key' || w.type === 'mnemonic_phrase')
    state.storeVersion = 3;
  }
};

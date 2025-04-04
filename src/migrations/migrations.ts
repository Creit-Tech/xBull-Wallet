import { sitesConnectionsMigration } from './1.sites-connections.migration';
import { walletsOperationsStoreMigration } from './2.wallets-operations.migration';
import { walletsAccountsStoreMigration } from './3.wallets-accounts-type.migration';
import { settingsStoreMigration } from './4.settings.migration';
import { anchorsStoreMigration } from './5.anchors.migration';
import { sorobanAccountsMigration } from './6.soroban.migration';
import { globalHashMigration } from './global-hash.migration';

export const migrationsHandler = (storeName: string, state: any, initialState: any) => {

  if (storeName === 'sites-connections' && state.siteConnectionDocVersion !== initialState.siteConnectionDocVersion) {
    for (const entityKey of Object.keys(state.entities)) {
      sitesConnectionsMigration(state.entities[entityKey]);
    }
  }

  if (storeName === 'wallets-operations' && state.storeVersion !== initialState.storeVersion) {
    walletsOperationsStoreMigration(state);
  }

  if (storeName === 'wallets-accounts' && state.storeVersion !== initialState.storeVersion) {
    walletsAccountsStoreMigration(state);
    sorobanAccountsMigration(state);
  }

  if (storeName === 'settings' && state.storeVersion !== initialState.storeVersion) {
    settingsStoreMigration(state);
  }

  if (storeName === 'anchors' && state.storeVersion !== initialState.storeVersion) {
    anchorsStoreMigration(state);
  }

  if (storeName === 'wallets' && state.storeVersion !== initialState.storeVersion) {
    globalHashMigration(state);
  }

  return state;

};

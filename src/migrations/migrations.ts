import { sitesConnectionsMigration } from './1.sites-connections.migration';
import { walletsOperationsStoreMigration } from './2.wallets-operations.migration';

export const migrationsHandler = (storeName: string, state: any, initialState: any) => {

  if (storeName === 'sites-connections' && state.siteConnectionDocVersion !== initialState.siteConnectionDocVersion) {
    for (const entityKey of Object.keys(state.entities)) {
      sitesConnectionsMigration(state.entities[entityKey]);
    }
  }

  if (storeName === 'wallets-operations' && state.storeVersion !== initialState.storeVersion) {
    walletsOperationsStoreMigration(state);
  }

  return state;

};

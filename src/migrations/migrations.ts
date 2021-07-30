import { sitesConnectionsMigration } from './1.sites-connections.migration';

export const migrationsHandler = (storeName: string, state: any, initialState: any) => {

  if (storeName === 'sites-connections' && state.siteConnectionDocVersion !== initialState.siteConnectionDocVersion) {
    for (const entityKey of Object.keys(state.entities)) {
      sitesConnectionsMigration(state.entities[entityKey]);
    }
  }

  return state;

};

import { persistState, PersistStateSelectFn } from '@datorama/akita';
import { storageAkitaMiddleware } from './storage-akita.middleware';
import { debounceTime } from 'rxjs/operators';
import { IWallet, IWalletsAccount, WalletsAccountsState } from '~root/state';
import { migrationsHandler } from './migrations/migrations';

const storage = persistState({
  storage: storageAkitaMiddleware,
  preStorageUpdateOperator: () => debounceTime(500),
  include: [
    'wallets',
    'UI/wallets',
    'wallets-accounts',
    'UI/wallets-accounts',
    'wallets-assets',
    'UI/wallets-assets',
    'wallets-operations',
    'UI/wallets-operations',
    'settings',
    'sites-connections',
    'horizon-apis'
  ],
  preStorageUpdate(storeName: string, state: any): any {
    if (!!state.UIState) {
      delete state.UIState;
    }

    if (storeName === 'wallets-accounts') {
      const updatedEntities: any = {};
      Object.keys(state.entities).forEach(entityId => {
        updatedEntities[entityId] = {
          ...state.entities[entityId],
          // We do want to always think we haven't created the streams
          streamCreated: false,
          operationsStreamCreated: false,
        };
      });

      return {
        ...state,
        entities: updatedEntities,
      };
    }

    return state;
  },
  preStoreUpdate(storeName: string, state: any, initialState: any): any {
    return migrationsHandler(storeName, state, initialState);
  }
});

export const storageProviders = [{
  provide: 'persistStorage',
  useValue: storage
}];

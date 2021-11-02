import { persistState } from '@datorama/akita';
import { storageAkitaMiddleware } from './storage-akita.middleware';
import { debounceTime } from 'rxjs/operators';
import { migrationsHandler } from './migrations/migrations';
import { environment } from '~env';
import { PersistStateParams } from '@datorama/akita/lib/persistState';
import { storageMobileMiddleware } from './storage-mobile.middleware';

const persistStateParams: Partial<PersistStateParams> = {
  preStorageUpdateOperator: () => debounceTime(150),
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
        UIState: {},
        entities: updatedEntities,
      };
    }

    return state;
  },
  preStoreUpdate(storeName: string, state: any, initialState: any): any {
    return migrationsHandler(storeName, state, initialState);
  },
};

if (environment.platform === 'extension') {
  persistStateParams.storage = storageAkitaMiddleware;
} else if (environment.platform === 'mobile') {
  persistStateParams.storage = storageMobileMiddleware;
}

const storage = persistState(persistStateParams);

export const storageProviders = [{
  provide: 'persistStorage',
  useValue: storage
}];

import { persistState } from '@datorama/akita';
import { storageAkitaMiddleware } from './storage-akita.middleware';
import { debounceTime } from 'rxjs/operators';
import { migrationsHandler } from './migrations/migrations';
import { environment } from '~env';
import { PersistStateParams } from '@datorama/akita';
import { storageMobileMiddleware } from './storage-mobile.middleware';
import * as localForage from 'localforage';
import { snapshotManager } from '@datorama/akita';

let channel: BroadcastChannel;

const persistStateParams: Partial<PersistStateParams> = {
  include: [
    'wallets',
    'UI/wallets',
    'wallets-accounts',
    'UI/wallets-accounts',
    'wallets-assets',
    'UI/wallets-assets',
    'settings',
    'sites-connections',
    'horizon-apis',
    'earn-tokens',
    'earn-vaults',
    'earn-strategies',
    'walletconnect-sessions',
    'anchors',
    'anchors-auth-tokens',
    'gift-cards',
    'airtime'
  ],
  preStorageUpdate(storeName: string, state: any): any {
    try {
      if (environment.platform !== 'mobile') {
        if (!channel) {
          channel = new BroadcastChannel('xBull-storage-update-broadcast')
        }

        const snapshot = snapshotManager.getStoresSnapshot([storeName]);
        channel.postMessage(snapshot);
      }
    } catch (e) {
      console.warn('Broadcast of current storage state was not possible');
      console.error(e);
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
        UIState: {},
        entities: updatedEntities,
      };
    }

    return {
      ...state,
      UIState: {},
    };
  },
  preStoreUpdate(storeName: string, state: any, initialState: any): any {
    return migrationsHandler(storeName, state, initialState);
  },
  preStorageUpdateOperator: () => debounceTime(150),
};

if (environment.platform === 'extension') {
  persistStateParams.preStorageUpdateOperator = () => debounceTime(150);
  persistStateParams.storage = storageAkitaMiddleware;
} else if (environment.platform === 'mobile') {
  persistStateParams.preStorageUpdateOperator = () => debounceTime(1000);
  persistStateParams.storage = storageMobileMiddleware;
} else if (environment.platform === 'website') {
  localForage.config({
    driver: [localForage.INDEXEDDB, localForage.LOCALSTORAGE],
    name: 'xBull',
    version: 1.0,
    storeName: 'xBull-storage',
  });
  persistStateParams.storage = localForage;
  persistStateParams.key = 'xBull';
}

const storage = persistState(persistStateParams);

export const storageProviders = [{
  provide: 'persistStorage',
  useValue: storage
}];

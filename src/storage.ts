import { persistState, PersistStateSelectFn } from '@datorama/akita';
import { storageAkitaMiddleware } from './storage-akita.middleware';
import { debounceTime } from 'rxjs/operators';
import { IWallet, IWalletsAccount, WalletsAccountsState } from '~root/state';

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
  preStoreUpdate(storeName: string, state: any): any {
    return state;
  }
});

export const storageProviders = [{
  provide: 'persistStorage',
  useValue: storage
}];

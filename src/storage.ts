import { persistState } from '@datorama/akita';
import { storageAkitaMiddleware } from './storage-akita.middleware';
import { debounceTime } from 'rxjs/operators';

const storage = persistState({
  storage: storageAkitaMiddleware,
  preStorageUpdateOperator: () => debounceTime(1000),
  include: [
    'wallets',
    'wallets-accounts',
    // 'wallets-assets', TODO: active this as soon as we have complete doing the wallets assets part
  ]
});

export const storageProviders = [{
  provide: 'persistStorage',
  useValue: storage
}];

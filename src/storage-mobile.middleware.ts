import { PersistStateStorage } from '@datorama/akita/lib/persistState';
import * as localForage from 'localforage';

localForage.config({
  driver: localForage.INDEXEDDB,
  name: 'xbull_wallet',
  version: 1.0,
  storeName: 'akita-storage',
});

export const storageMobileMiddleware: PersistStateStorage = localForage;

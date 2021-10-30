import { Storage } from '@capacitor/storage';
import { PersistStateStorage } from '@datorama/akita/lib/persistState';

export const storageMobileMiddleware: PersistStateStorage = {
  async setItem(key: string, value: any): Promise<boolean> {
    await Storage.set({ key, value: JSON.stringify(value) });
    return true;
  },

  async getItem(key: string): Promise<any> {
    return Storage.get({ key })
      .then(response => {
        return response.value && JSON.parse(response.value);
      });
  },

  async clear(): Promise<void> {
    await Storage.clear();
  },
};

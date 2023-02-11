import { Preferences } from '@capacitor/preferences';

export const storageMobileMiddleware = {
  async setItem(key: string, value: any): Promise<boolean> {
    await Preferences.set({ key, value: JSON.stringify(value) });
    return true;
  },

  async getItem(key: string): Promise<any> {
    return Preferences.get({ key })
      .then(response => {
        return response.value && JSON.parse(response.value);
      });
  },

  async clear(): Promise<void> {
    await Preferences.clear();
  },
};

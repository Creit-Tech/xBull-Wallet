export const storageAkitaMiddleware = {
  setItem(key: string, value: any): Promise<boolean> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [key]: value }, () => {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        } else {
          return resolve(true);
        }
      });
    });
  },

  getItem(key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(key, (items: { [key: string]: any }) => {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        } else {
          return resolve(items[key]);
        }
      });
    });
  },

  clear(): void {
    chrome.storage.local.clear();
  },
};

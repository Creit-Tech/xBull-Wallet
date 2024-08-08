import { HorizonApisState, IHorizonApi, SitesConnectionsState, WalletsAccountsState } from '~root/state';
import { ISitePermissions } from '~extension/interfaces';

export const getWindowId = () => new Promise<number | undefined>((resolve, reject) => {
  chrome.storage.local.get(['windowId'], (items: { [key: string]: number | undefined }) => {
    if (chrome.runtime.lastError) {
      return reject(chrome.runtime.lastError);
    } else {
      return resolve(items?.windowId);
    }
  });
});

export const setWindowId = (windowId: number | undefined) => new Promise((resolve, reject) => {
  chrome.storage.local.set({ windowId }, () => {
    if (chrome.runtime.lastError) {
      return reject(chrome.runtime.lastError);
    } else {
      return resolve(true);
    }
  });
});

const getStore = () => new Promise<{
  'sites-connections': SitesConnectionsState;
  'wallets-accounts': WalletsAccountsState;
  'horizon-apis': HorizonApisState;
}>((resolve, reject) => {
  chrome.storage.local.get(['AkitaStores'], (items: { [key: string]: any }) => {
    if (chrome.runtime.lastError) {
      return reject(chrome.runtime.lastError);
    } else if (!items.AkitaStores) {
      return reject(new Error(`Wallet hasn't been set upp`));
    } else {
      return resolve(items.AkitaStores);
    }
  });
});

export const getSitePermissions = async (host: string): Promise<ISitePermissions | undefined> => {
  const store = await getStore();
  const sitesConnections = store['sites-connections'];

  if (!sitesConnections) {
    return;
  }

  const targetSite = sitesConnections.entities && sitesConnections.entities[host];

  return targetSite && {
    canRequestPublicKey: targetSite.canRequestPublicKey,
    canRequestSign: targetSite.canRequestSign,
  };
};

export const getActiveAccount = async () => {
  const store = await getStore();
  const walletsAccounts = store['wallets-accounts'];

  if (walletsAccounts.active === null) {
    throw new Error('There are no active account');
  }

  const activeAccount = walletsAccounts.entities && walletsAccounts.entities[walletsAccounts.active];

  if (!activeAccount) {
    throw new Error('There are no active account');
  } else {
    return activeAccount;
  }
};

export const getActiveApi = async () => {
  const store = await getStore();
  const apisState: HorizonApisState = store['horizon-apis'];

  if (apisState.active === null) {
    throw new Error('There are no active network');
  }

  const activeApi: IHorizonApi | undefined = apisState.entities && apisState.entities[apisState.active];

  if (!activeApi) {
    throw new Error('There are no active network');
  } else {
    return activeApi;
  }
};

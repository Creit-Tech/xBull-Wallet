import { SitesConnectionsState, WalletsAccountsState } from '~root/state';
import { ISitePermissions } from '~extension/interfaces';

const getStore = () => new Promise<{ 'sites-connections': SitesConnectionsState, 'wallets-accounts': WalletsAccountsState }>((resolve, reject) => {
  chrome.storage.local.get(['AkitaStores'], (items: { [key: string]: any }) => {
    if (chrome.runtime.lastError) {
      return reject(chrome.runtime.lastError);
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

  const activeAccount = walletsAccounts.entities && walletsAccounts.entities[walletsAccounts.active]

  if (!activeAccount) {
    throw new Error('There are no active account');
  } else {
    return activeAccount;
  }
};
import { SitesConnectionsState } from '~root/state';
import { ISitePermissions } from '~extension/interfaces';

const getStore = () => new Promise<{ 'sites-connection': SitesConnectionsState }>((resolve, reject) => {
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
  const sitesConnections = store['sites-connection'];

  if (!sitesConnections) {
    return;
  }

  const targetSite = sitesConnections.entities && sitesConnections.entities[host];

  return targetSite && {
    canRequestPublicKey: targetSite.canRequestPublicKey,
    canRequestSign: targetSite.canRequestSign,
  };
};

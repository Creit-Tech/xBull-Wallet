import {
  IConnectRequestPayload, IRuntimeConnectMessage,
  IRuntimeConnectResponse,
  IRuntimeErrorResponse,
  ISitePermissions, RuntimeMessage,
  XBULL_CONNECT_BACKGROUND,
} from '~extension/interfaces';
import { getSitePermissions } from '~extension/background/state.background';

export const requestConnection = async (message: IRuntimeConnectMessage): Promise<IRuntimeConnectResponse | IRuntimeErrorResponse> => {
  const payload = message.payload;
  const savedPermissions = await getSitePermissions(payload.host);

  if (!!savedPermissions) {
    return {
      payload: savedPermissions,
      error: false,
    };
  }

  return new Promise((resolve, reject) => {
    chrome.windows.create({
      type: 'popup',
      url: 'index.html',
      left: 0,
      top: 0,
      height: 640,
      width: 380,
    }, async popup => {

      // We wait a little before the tab is open
      await new Promise(r => setTimeout(r, 500));
      const extensionTab = popup?.tabs && popup.tabs[0].id;

      if (!extensionTab) {
        return reject(new Error(`We couldn't open the extension`));
      }

      chrome.tabs.sendMessage(extensionTab, message,
        (response: ISitePermissions) => {
          resolve({ error: false, payload: response });
        }
      );
    });
  });

};

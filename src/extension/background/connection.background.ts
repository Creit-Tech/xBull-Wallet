import {
  IRuntimeConnectMessage,
  IRuntimeConnectResponse,
  IRuntimeErrorResponse,
  XBULL_CONNECT_BACKGROUND,
} from '~extension/interfaces';
import { isEqual } from 'lodash';
import { getSitePermissions } from '~extension/background/state.background';

export const requestConnection = async (message: IRuntimeConnectMessage): Promise<IRuntimeConnectResponse | IRuntimeErrorResponse> => {
  const payload = message.payload;
  const savedPermissions = await getSitePermissions(payload.origin + '_' + payload.host);

  if (!!savedPermissions && isEqual(savedPermissions, payload.permissions)) {
    return {
      payload: savedPermissions,
      error: false,
    };
  }

  return new Promise((resolve) => {
    chrome.windows.create({
      type: 'popup',
      url: 'index.html#/sign-from-background/',
      height: 640,
      width: 380,
    }, async (popup) => {
      if (!popup) {
        return resolve({
          error: true,
          errorMessage: `We couldn't open the extension`
        });
      }

      // We wait a little before the tab is open
      await new Promise(r => setTimeout(r, 500));
      const extensionTab = popup.tabs && popup.tabs[0];

      if (!extensionTab) {
        return resolve({
          error: true,
          errorMessage: `We couldn't open the extension`
        });
      }

      const port = chrome.runtime.connect(chrome.runtime.id, { name: XBULL_CONNECT_BACKGROUND });
      port.onMessage.addListener((response: 'ready' | IRuntimeConnectResponse | IRuntimeErrorResponse) => {
        if (response === 'ready') {
          port.postMessage(message);
        } else {
          if (!response.error) {
            // Check if the response is formatted as expected
            if (
              typeof response.payload.canRequestPublicKey === 'undefined'
              || typeof response.payload.canRequestSign === 'undefined'
            ) {
              resolve({
                error: true,
                errorMessage: 'Response from extension was not the expected one'
              });
            } else {
              resolve({
                error: false,
                payload: {
                  canRequestPublicKey: response.payload.canRequestPublicKey,
                  canRequestSign: response.payload.canRequestSign
                }
              });
            }
          } else {
            resolve({
              error: true,
              errorMessage: response.errorMessage,
            });
          }
        }
      });

    });
  });

};

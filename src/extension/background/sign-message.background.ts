import {
  IRuntimeErrorResponse, IRuntimeSignMessageMessage, IRuntimeSignMessageResponse,
  XBULL_SIGN_MESSAGE_BACKGROUND,
} from '~extension/interfaces';
import { getSitePermissions } from '~extension/background/state.background';

export const requestSignMessage = async (message: IRuntimeSignMessageMessage): Promise<IRuntimeSignMessageResponse | IRuntimeErrorResponse> => {
  const payload = message.payload;
  const savedPermissions = await getSitePermissions(payload.origin + '_' + payload.host);

  if (!savedPermissions?.canRequestSign) {
    return {
      error: true,
      errorMessage: 'You are not authorized to request signing a transaction from this wallet',
    };
  }

  return new Promise(resolve => {
    chrome.windows.create({
      type: 'popup',
      url: 'index.html#/sign-from-background/',
      height: 640,
      width: 380,
    }, async popup => {
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

      const port = chrome.runtime.connect(chrome.runtime.id, { name: XBULL_SIGN_MESSAGE_BACKGROUND });
      port.onMessage.addListener((response: 'ready' | IRuntimeSignMessageResponse | IRuntimeErrorResponse) => {
        if (response === 'ready') {
          port.postMessage(message);
        } else {
          if (!response.error) {
            // Check if the response is formatted as expected
            if (typeof response.payload === 'undefined') {
              resolve({
                error: true,
                errorMessage: 'Response from extension was not the expected one'
              });
            } else {
              resolve({
                error: false,
                payload: response.payload
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

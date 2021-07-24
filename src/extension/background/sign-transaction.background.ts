import { IRuntimeConnectResponse, IRuntimeErrorResponse, IRuntimeSignXDRMessage, IRuntimeSignXDRResponse } from '~extension/interfaces';
import { getSitePermissions } from '~extension/background/state.background';

export const requestSignXDR = async (message: IRuntimeSignXDRMessage): Promise<IRuntimeSignXDRResponse | IRuntimeErrorResponse> => {
  const payload = message.payload;
  const savedPermissions = await getSitePermissions(payload.origin + '_' + payload.host);

  if (!savedPermissions?.canRequestSign) {
    return {
      error: true,
      errorMessage: 'You are not authorized to request singing a transaction from this wallet',
    };
  }

  return new Promise(resolve => {
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
        return resolve({
          error: true,
          errorMessage: `We couldn't open the extension`
        });
      }

      chrome.tabs.sendMessage(extensionTab, message, (response: IRuntimeSignXDRResponse | IRuntimeErrorResponse) => {
        // Check if the response is formatted as expected
        if (!response.error) {
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
      });
    });
  });
};

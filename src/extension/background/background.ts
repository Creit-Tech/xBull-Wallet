import { RuntimeMessage, RuntimeResponse, XBULL_CONNECT_BACKGROUND } from '../interfaces';
import { requestConnection } from '~extension/background/connection.background';
import { requestPublicKey } from '~extension/background/public-key.background';

chrome.runtime.onMessage.addListener((message: RuntimeMessage, sender, sendResponse) => {
  let response: RuntimeResponse;

  switch (message.event) {
    case XBULL_CONNECT_BACKGROUND:
      requestConnection(message)
        .then(backgroundResponse => {
          return sendResponse(backgroundResponse);
        })
        .catch(e => {
          console.error(e);
          response = {
            error: true,
            errorMessage: 'Connection failed'
          };
          return sendResponse(response);
        });
      break;

    case 'XBULL_GET_PUBLIC_KEY_BACKGROUND':
      requestPublicKey(message)
        .then(sendResponse)
        .catch(e => {
          console.error(e);
          response = {
            error: true,
            errorMessage: 'Connection failed'
          };
          return sendResponse(response);
        });
      break;

    default:
      response = {
        error: true,
        errorMessage: `We can't handle this type of event`,
      };
      return sendResponse(response);
  }

  return true;
});

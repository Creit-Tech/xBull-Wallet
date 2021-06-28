import {
  RuntimeMessage,
  RuntimeResponse,
  XBULL_CONNECT_BACKGROUND,
  XBULL_GET_PUBLIC_KEY_BACKGROUND,
  XBULL_SIGN_XDR_BACKGROUND,
} from '../interfaces';
import { requestConnection } from '~extension/background/connection.background';
import { requestPublicKey } from '~extension/background/public-key.background';
import { requestSignXDR } from '~extension/background/sign-transaction.background';

chrome.runtime.onMessage.addListener((message: RuntimeMessage, sender, sendResponse) => {
  let response: RuntimeResponse;

  const catchError = (error: any) => {
    console.error(error);
    response = {
      error: true,
      errorMessage: 'Connection failed'
    };
    return sendResponse(response);
  };

  switch (message.event) {
    case XBULL_CONNECT_BACKGROUND:
      requestConnection(message)
        .then(backgroundResponse => {
          return sendResponse(backgroundResponse);
        })
        .catch(catchError);
      break;

    case XBULL_GET_PUBLIC_KEY_BACKGROUND:
      requestPublicKey(message)
        .then(sendResponse)
        .catch(catchError);
      break;

    case XBULL_SIGN_XDR_BACKGROUND:
      requestSignXDR(message)
        .then(sendResponse)
        .catch(catchError);
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

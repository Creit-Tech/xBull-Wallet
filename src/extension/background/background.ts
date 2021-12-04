// This file is use in v2 manifests extensions
import browser from 'webextension-polyfill';
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

let windowId: number | undefined;

(browser?.action || browser?.browserAction).onClicked.addListener(async () => {
  let window: browser.Windows.Window;
  if (!!windowId) {
    try {
      window = await browser.windows.get(windowId);
      if (!!window) {
        window.alwaysOnTop = true;
        await browser.windows.update(windowId, {
          focused: true,
        });
        return;
      }
    } catch (e) {
      console.error(e);
    }
  }

  window = await browser.windows.create({
    url: chrome.runtime.getURL('index.html'),
    height: 640,
    width: 380,
    type: 'popup',
    focused: true,
  });

  window.alwaysOnTop = true;
  windowId = window.id;
});

browser.runtime.onMessage.addListener(async (message: RuntimeMessage, sender): Promise<RuntimeResponse> => {
  if (!!windowId) {
    try {
      const window = await browser.windows.get(windowId);
      if (!!window) {
        await browser.windows.remove(windowId);
        windowId = undefined;
      }
    } catch (e) {
      console.error(e);
    }
  }

  const catchError = (error: any): RuntimeResponse => {
    console.error(error);
    return {
      error: true,
      errorMessage: 'Connection failed'
    };
  };

  switch (message.event) {
    case XBULL_CONNECT_BACKGROUND:
      return requestConnection(message)
        .catch(catchError);

    case XBULL_GET_PUBLIC_KEY_BACKGROUND:
      return requestPublicKey(message)
        .catch(catchError);

    case XBULL_SIGN_XDR_BACKGROUND:
      return requestSignXDR(message)
        .catch(catchError);

    default:
      return {
        error: true,
        errorMessage: `We can't handle this type of event`,
      };
  }
});

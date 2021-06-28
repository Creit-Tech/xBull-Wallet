import {
  IConnectRequestPayload, IGetPublicKeyRequestPayload,
  IRuntimeConnectResponse, IRuntimeGetPublicKeyResponse, IRuntimeSignXDRResponse, ISignXDRRequestPayload,
  XBULL_CONNECT,
  XBULL_CONNECT_BACKGROUND,
  XBULL_GET_PUBLIC_KEY, XBULL_GET_PUBLIC_KEY_BACKGROUND, XBULL_SIGN_XDR, XBULL_SIGN_XDR_BACKGROUND,
} from '../interfaces';

// Inject SDK in the document
const sdkScript = document.createElement('script');
sdkScript.src = chrome.runtime.getURL('sdk.js');
sdkScript.onload = () => sdkScript.remove();
(document.head || document.documentElement).appendChild(sdkScript);


window.addEventListener(XBULL_CONNECT, (event: any) => {
  const payload: IConnectRequestPayload = event.detail;

  if (payload.origin === window.origin) {
    chrome.runtime.sendMessage({
      event: XBULL_CONNECT_BACKGROUND,
      payload,
    }, (response: IRuntimeConnectResponse) => {
      window.dispatchEvent(new CustomEvent(event.detail.eventId, { detail: response }));
    });
  }
});


window.addEventListener(XBULL_GET_PUBLIC_KEY, (event: any) => {
  const payload: IGetPublicKeyRequestPayload = event.detail;

  if (payload.origin === window.origin) {
    chrome.runtime.sendMessage({
      event: XBULL_GET_PUBLIC_KEY_BACKGROUND,
      payload,
    }, (response: IRuntimeGetPublicKeyResponse) => {
      window.dispatchEvent(new CustomEvent(event.detail.eventId, { detail: response }));
    });
  }
});


window.addEventListener(XBULL_SIGN_XDR, (event: any) => {
  const payload: ISignXDRRequestPayload = event.detail;

  if (payload.origin === window.origin) {
    chrome.runtime.sendMessage({
      event: XBULL_SIGN_XDR_BACKGROUND,
      payload,
    }, (response: IRuntimeSignXDRResponse) => {
      window.dispatchEvent(new CustomEvent(event.detail.eventId, { detail: response }));
    });
  }
});

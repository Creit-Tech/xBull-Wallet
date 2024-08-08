import {
  EventTypes,
  IConnectRequestPayload,
  IGetNetworkRequestPayload,
  IGetPublicKeyRequestPayload,
  IRuntimeConnectResponse,
  IRuntimeGetNetworkResponse,
  IRuntimeGetPublicKeyResponse,
  IRuntimeSignXDRResponse,
  ISignXDRRequestPayload,
  XBULL_CONNECT,
  XBULL_CONNECT_BACKGROUND,
  XBULL_GET_NETWORK,
  XBULL_GET_NETWORK_BACKGROUND,
  XBULL_GET_PUBLIC_KEY,
  XBULL_GET_PUBLIC_KEY_BACKGROUND,
  XBULL_SIGN_XDR,
  XBULL_SIGN_XDR_BACKGROUND,
} from '../interfaces';

// message
window.addEventListener('message', (event: any) => {
  if (event.source !== window || !event.data || event.origin !== window.origin) {
    return;
  }

  const {
    type,
    detail,
    eventId,
    returnFromCS
  } = event.data as { detail: any , type: EventTypes, eventId: string, returnFromCS?: boolean };

  if (returnFromCS) {
    return;
  }

  let payload: IConnectRequestPayload | IGetPublicKeyRequestPayload | ISignXDRRequestPayload;
  switch (type) {
    case XBULL_CONNECT:
      payload = detail as IConnectRequestPayload;
      chrome.runtime.sendMessage({
        event: XBULL_CONNECT_BACKGROUND,
        payload,
      }, (response: IRuntimeConnectResponse) => {
        window.postMessage({
          returnFromCS: true,
          detail: response,
          eventId,
        }, '*');
      });
      break;

    case XBULL_GET_PUBLIC_KEY:
      payload = detail as IGetPublicKeyRequestPayload;
      chrome.runtime.sendMessage({
        event: XBULL_GET_PUBLIC_KEY_BACKGROUND,
        payload,
      }, (response: IRuntimeGetPublicKeyResponse) => {
        window.postMessage({
          returnFromCS: true,
          detail: response,
          eventId,
        }, '*');
      });
      break;

    case XBULL_SIGN_XDR:
      payload = detail as ISignXDRRequestPayload;

      if (payload.origin === window.origin) {
        chrome.runtime.sendMessage({
          event: XBULL_SIGN_XDR_BACKGROUND,
          payload,
        }, (response: IRuntimeSignXDRResponse) => {
          window.postMessage({
            returnFromCS: true,
            detail: response,
            eventId,
          }, '*');
        });
      }
      break;

    case XBULL_GET_NETWORK:
      payload = detail as IGetNetworkRequestPayload;
      chrome.runtime.sendMessage({
        event: XBULL_GET_NETWORK_BACKGROUND,
        payload,
      }, (response: IRuntimeGetNetworkResponse) => {
        window.postMessage({
          returnFromCS: true,
          detail: response,
          eventId,
        }, '*');
      });
      break;
  }
});

// Inject SDK in the document
const sdkScript = document.createElement('script');
sdkScript.src = chrome.runtime.getURL('sdk.js');
sdkScript.onload = () => {
  window.postMessage({
    type: 'XBULL_INJECTED',
    returnFromCS: true,
  }, window.origin);
  sdkScript.remove();
};
(document.head || document.documentElement).appendChild(sdkScript);

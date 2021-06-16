import { IConnectRequestPayload, IRuntimeConnectResponse, ISitePermissions, XBULL_CONNECT, XBULL_CONNECT_BACKGROUND } from '../interfaces';

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

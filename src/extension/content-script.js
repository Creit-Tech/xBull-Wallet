"use strict";
console.log('soy el content');
// Inject SDK in the document
const sdkScript = document.createElement('script');
sdkScript.src = chrome.runtime.getURL('xbull-sdk.js');
sdkScript.onload = () => sdkScript.remove();
(document.head || document.documentElement).appendChild(sdkScript);
window.addEventListener('XBULL_CONNECT', (event) => {
    const payload = event.detail;
    if (payload.origin === window.origin) {
        chrome.runtime.sendMessage({
            event: 'XBULL_CONNECT_BACKGROUND',
            payload,
        });
        window.dispatchEvent(new CustomEvent('XBULL_CONNECT_RESPONSE', {
            detail: Object.assign(Object.assign({}, payload), { extra: 'lol' })
        }));
    }
});
// chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
//   console.log({ message });
//   sendResponse(message);
// });

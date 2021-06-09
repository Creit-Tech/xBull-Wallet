"use strict";
class XbullSdk {
    constructor() {
        this.permissions = {
            getPublicKey: false,
            requestSign: false,
        };
        this.isConnected = false;
    }
    connect(params) {
        return new Promise((resolve, reject) => {
            // We check if the user sent wrong values
            if (!!params && !Object.values(params).every(value => typeof value === 'boolean')) {
                return reject(new Error('Wrong values sent, you can only sent booleans values'));
            }
            if (this.isConnected) {
                return resolve(this.permissions);
            }
            window.addEventListener('XBULL_CONNECT_RESPONSE', (event) => {
                const payload = event.detail;
                if (!!payload.error) {
                    return reject(event.error);
                }
                return resolve({
                    getPublicKey: payload.getPublicKey,
                    requestSign: payload.requestSign,
                });
            });
            window.dispatchEvent(new CustomEvent('XBULL_CONNECT', {
                detail: {
                    origin: window.origin,
                    host: window.location.host,
                    permissions: params && {
                        getPublicKey: params.getPublicKey,
                        requestSign: params.requestSign,
                    },
                }
            }));
        });
    }
}
window.xBullSDK = new XbullSdk();

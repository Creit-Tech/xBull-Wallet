class XbullSdk {
  permissions = {
    getPublicKey: false,
    requestSign: false,
  };

  isConnected = false;

  constructor() {}

  connect(params?: Partial<XbullSdk['permissions']>): Promise<XbullSdk['permissions']> {
    return new Promise((resolve, reject) => {
      // We check if the user sent wrong values
      if (!!params && !Object.values(params).every(value => typeof value === 'boolean')) {
        return reject(new Error('Wrong values sent, you can only sent booleans values'));
      }

      if (this.isConnected) {
        return resolve(this.permissions);
      }

      window.addEventListener('XBULL_CONNECT_RESPONSE', (event: any) => {
        const payload: XbullSdk['permissions'] & { error?: string } = event.detail;
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

(window as any).xBullSDK = new XbullSdk();

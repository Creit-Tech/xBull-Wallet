import {
  EventTypes,
  IConnectRequestPayload,
  IGetPublicKeyRequestPayload,
  IRuntimeConnectResponse,
  IRuntimeErrorResponse,
  IRuntimeGetPublicKeyResponse,
  IRuntimeSignXDRResponse,
  ISignXDRRequestPayload,
  ISitePermissions,
  XBULL_CONNECT,
  XBULL_GET_PUBLIC_KEY, XBULL_SIGN_XDR,
} from '../interfaces';

class Sdk {
  isConnected = false;

  constructor() { }

  private sendEventToContentScript<T, R>(eventName: EventTypes, payload: T): Promise<CustomEvent<R>> {
    return new Promise<CustomEvent<R>>((resolve) => {
      // We use this id to create a random event listener and avoid mixing messages
      const eventId = (new Date().getTime() + Math.random()).toString(16);

      const eventListener = (event: any) => {
        resolve(event);
        window.removeEventListener(eventId, eventListener, false);
      };

      window.addEventListener(eventId, eventListener, false);

      const dispatchEventParams: CustomEventInit<T> = {
        detail: {
          ...payload,
          eventId,
        },
      };

      window.dispatchEvent(new CustomEvent(eventName, dispatchEventParams));
    });
  }

  async connect(permissions: IConnectRequestPayload['permissions']): Promise<IRuntimeConnectResponse['payload']> {
    if (
      !permissions ||
      !permissions.canRequestPublicKey && !permissions.canRequestSign
    ) {
      throw new Error('Value sent is not valid');
    }

    const dispatchEventParams: IConnectRequestPayload = {
      origin: window.origin,
      host: window.location.host,
      permissions,
    };

    // tslint:disable-next-line:max-line-length
    const { detail } = await this.sendEventToContentScript<IConnectRequestPayload, IRuntimeConnectResponse | IRuntimeErrorResponse>(XBULL_CONNECT, dispatchEventParams);

    if (detail.error) {
      throw new Error(detail.errorMessage);
    }

    this.isConnected = true;

    return detail.payload;
  }

  async getPublicKey(): Promise<string> {
    const dispatchEventParams: IGetPublicKeyRequestPayload = {
      origin: window.origin,
      host: window.location.host,
    };

    const { detail } = await this.sendEventToContentScript<
      IGetPublicKeyRequestPayload,
      IRuntimeGetPublicKeyResponse | IRuntimeErrorResponse
    >(XBULL_GET_PUBLIC_KEY, dispatchEventParams);

    if (detail.error) {
      throw new Error(detail.errorMessage);
    }

    return detail.payload;
  }

  async signXDR(xdr: string): Promise<string> {
    const dispatchEventParams: ISignXDRRequestPayload = {
      origin: window.origin,
      host: window.location.host,
      xdr
    };

    const { detail } = await this.sendEventToContentScript<
      ISignXDRRequestPayload,
      IRuntimeSignXDRResponse | IRuntimeErrorResponse
    >(XBULL_SIGN_XDR, dispatchEventParams);

    if (detail.error) {
      throw new Error(detail.errorMessage);
    }

    return detail.payload;
  }

}

(window as any).xBullSDK = new Sdk();

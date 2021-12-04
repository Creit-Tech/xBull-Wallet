import {
  EventTypes,
  IConnectRequestPayload,
  IGetPublicKeyRequestPayload,
  IRuntimeConnectResponse,
  IRuntimeErrorResponse,
  IRuntimeGetPublicKeyResponse,
  IRuntimeSignXDRResponse,
  ISignXDRRequestPayload,
  XBULL_CONNECT,
  XBULL_GET_PUBLIC_KEY, XBULL_SIGN_XDR,
} from '../interfaces';
import { Networks } from 'stellar-sdk';

class Sdk {
  isConnected = false;

  constructor() {}

  // tslint:disable-next-line:only-arrow-functions
  private sendEventToContentScript<T, R>(eventName: EventTypes, payload: T): Promise<any> {
    return new Promise<CustomEvent<R>>((resolve) => {
      // We use this id to create a random event listener and avoid mixing messages
      const eventId = (new Date().getTime() + Math.random()).toString(16);

      const eventListener = (event: any) => {
        // tslint:disable-next-line:triple-equals
        if (event.source !== window || !event.data || event.origin !== window.origin) {
          return;
        }

        const response = event.data as { detail: R, eventId: string, returnFromCS?: boolean };

        if (response.eventId === eventId && response.returnFromCS) {
          resolve(event);
          window.removeEventListener('message', eventListener, false);
        }
      };

      window.addEventListener('message', eventListener, false);

      window.postMessage({
        type: eventName,
        eventId,
        detail: payload,
      }, '*');
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
    const response = await this.sendEventToContentScript<IConnectRequestPayload, IRuntimeConnectResponse | IRuntimeErrorResponse>(XBULL_CONNECT, dispatchEventParams);
    const { detail } = response.data;

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

    const response = await this.sendEventToContentScript<
      IGetPublicKeyRequestPayload,
      IRuntimeGetPublicKeyResponse | IRuntimeErrorResponse
    >(XBULL_GET_PUBLIC_KEY, dispatchEventParams);

    const { detail } = response.data;

    if (detail.error) {
      throw new Error(detail.errorMessage);
    }

    return detail.payload;
  }

  async signXDR(xdr: string, options: { network?: Networks; publicKey?: string }): Promise<string> {
    const dispatchEventParams: ISignXDRRequestPayload = {
      origin: window.origin,
      host: window.location.host,
      network: options?.network,
      publicKey: options?.publicKey,
      xdr
    };

    const response = await this.sendEventToContentScript<
      ISignXDRRequestPayload,
      IRuntimeSignXDRResponse | IRuntimeErrorResponse
    >(XBULL_SIGN_XDR, dispatchEventParams);

    const { detail } = response.data;

    if (detail.error) {
      throw new Error(detail.errorMessage);
    }

    return detail.payload;
  }

}

(window as any).xBullSDK = new Sdk();

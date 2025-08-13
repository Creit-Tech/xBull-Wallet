import {
  EventTypes,
  IConnectRequestPayload,
  IGetNetworkRequestPayload,
  IGetPublicKeyRequestPayload,
  IRuntimeConnectResponse,
  IRuntimeErrorResponse,
  IRuntimeGetNetworkResponse,
  IRuntimeGetPublicKeyResponse, IRuntimeSignMessageMessage, IRuntimeSignXDRMessage,
  IRuntimeSignXDRResponse,
  ISignMessageRequestPayload,
  ISignXDRRequestPayload,
  SdkResponse,
  XBULL_CONNECT,
  XBULL_GET_NETWORK,
  XBULL_GET_PUBLIC_KEY,
  XBULL_SIGN_MESSAGE,
  XBULL_SIGN_XDR,
} from '../interfaces';
import { Networks } from '@stellar/stellar-sdk';

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

  /**
   * @deprecated
   * This function will be removed at some point. Use `getAddress`, instead.
   * https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0043.md
   */
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

    if (!detail || detail.error) {
      throw new Error(detail?.errorMessage || 'Unexpected error');
    }

    this.isConnected = true;

    return detail.payload;
  }

  /**
   * @deprecated
   * This function will be removed at some point. Use `getAddress` instead.
   * https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0043.md
   */
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

    if (!detail || detail.error) {
      throw new Error(detail?.errorMessage || 'Unexpected error');
    }

    return detail.payload;
  }

  /**
   * @deprecated
   * This function will be removed at some point. Use `signTransaction` instead.
   * https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0043.md
   */
  async signXDR(xdr: string, options: { network?: Networks; publicKey?: string }): Promise<string> {
    const dispatchEventParams: ISignXDRRequestPayload = {
      origin: window.origin,
      host: window.location.host,
      network: options?.network,
      publicKey: options?.publicKey,
      xdr,
      xdrType: 'Transaction',
    };

    const response = await this.sendEventToContentScript<
      ISignXDRRequestPayload,
      IRuntimeSignXDRResponse | IRuntimeErrorResponse
    >(XBULL_SIGN_XDR, dispatchEventParams);

    const { detail } = response.data;

    if (!detail || detail.error) {
      throw new Error(detail?.errorMessage || 'Unexpected error');
    }

    return detail.payload.signedXdr;
  }

  /**
   * This function ask the user to confirm they want to accept request from this website,
   * this function is automatically called when using other functions.
   */
  async enableConnection(): Promise<void> {
    const dispatchEventParams: IConnectRequestPayload = {
      origin: window.origin,
      host: window.location.host,
      permissions: { canRequestPublicKey: true, canRequestSign: true },
    };

    const response = await this.sendEventToContentScript<IConnectRequestPayload, IRuntimeConnectResponse | IRuntimeErrorResponse>(
      XBULL_CONNECT,
      dispatchEventParams
    );
    const { detail } = response.data;

    if (!detail || detail.error) {
      throw {
        code: detail?.code || -1,
        message: detail?.errorMessage || 'Unexpected error',
      };
    }

    this.isConnected = true;
  }

  /**
   * https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0043.md#signtransaction
   */
  async getAddress(): Promise<SdkResponse<{ address: string }>> {
    try {
      await this.enableConnection();
    } catch (e: any) {
      return {
        error: {
          code: e?.code || -1,
          message: e?.message || 'Unexpected error',
        }
      };
    }

    const dispatchEventParams: IGetPublicKeyRequestPayload = {
      origin: window.origin,
      host: window.location.host,
    };

    const response = await this.sendEventToContentScript<
      IGetPublicKeyRequestPayload,
      IRuntimeGetPublicKeyResponse | IRuntimeErrorResponse
    >(XBULL_GET_PUBLIC_KEY, dispatchEventParams);

    const { detail } = response.data;

    if (!detail || detail.error) {
      return {
        error: {
          code: detail?.code || -1,
          message: detail?.errorMessage || 'Unexpected error',
        }
      };
    }

    return { address: detail.payload };
  }

  /**
   * https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0043.md#signtransaction
   */
  async signTransaction(params: {
    xdr: string,
    opts?: {
      networkPassphrase?: Networks,
      address?: string;
      submit?: boolean;
      submitUrl?: string;
    };
  }): Promise<SdkResponse<{ signedTxXdr: string; signerAddress: string; }>> {
    if (params.opts?.submit || params.opts?.submitUrl) {
      return {
        error: {
          code: -1,
          message: 'Parameters `submit` and `submitUrl` are not supported',
        },
      };
    }

    try {
      await this.enableConnection();
    } catch (e: any) {
      return {
        error: {
          code: e?.code || -1,
          message: e?.message || 'Unexpected error',
        }
      };
    }

    const dispatchEventParams: ISignXDRRequestPayload = {
      origin: window.origin,
      host: window.location.host,
      network: params.opts?.networkPassphrase,
      publicKey: params.opts?.address,
      xdr: params.xdr,
      xdrType: 'Transaction',
    };

    const response = await this.sendEventToContentScript<
      ISignXDRRequestPayload,
      IRuntimeSignXDRResponse | IRuntimeErrorResponse
    >(XBULL_SIGN_XDR, dispatchEventParams);

    const { detail } = response.data;

    if (!detail || detail.error) {
      return {
        error: {
          code: detail?.code || -1,
          message: detail?.errorMessage || 'Unexpected error',
        }
      };
    }

    return {
      signedTxXdr: detail.payload.signedXdr,
      signerAddress: detail.payload.signerAddress,
    };
  }

  /**
   * This method returns the information of the currently selected network
   */
  async getNetwork(): Promise<SdkResponse<{ network: string; networkPassphrase: string; }>> {
    try {
      await this.enableConnection();
    } catch (e: any) {
      return {
        error: {
          code: e?.code || -1,
          message: e?.message || 'Unexpected error',
        }
      };
    }

    const dispatchEventParams: IGetNetworkRequestPayload = {
      origin: window.origin,
      host: window.location.host,
    };

    const response = await this.sendEventToContentScript<
      IGetNetworkRequestPayload,
      IRuntimeGetNetworkResponse | IRuntimeErrorResponse
    >(XBULL_GET_NETWORK, dispatchEventParams);

    const { detail } = response.data;

    if (!detail || detail.error) {
      return {
        error: {
          code: detail?.code || -1,
          message: detail?.errorMessage || 'Unexpected error',
        }
      };
    }

    return {
      network: detail.payload.network,
      networkPassphrase: detail.payload.networkPassphrase,
    };
  }

  /**
   * https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0043.md#signmessage
   */
  async signMessage(
    message: string,
    opts?: {
      networkPassphrase?: Networks,
      address?: string;
    }
  ): Promise<SdkResponse<{ signedMessage: string; signerAddress: string; }>> {
    if (!message) return {
      error: {
        code: -1,
        message: 'The message must be defined.'
      }
    }

    try {
      await this.enableConnection();
    } catch (e: any) {
      return {
        error: {
          code: e?.code || -1,
          message: e?.message || 'Unexpected error',
        }
      };
    }

    const dispatchEventParams: ISignMessageRequestPayload = {
      origin: window.origin,
      host: window.location.host,
      message: message,
      publicKey: opts?.address,
      network: opts?.networkPassphrase,
    };

    const response = await this.sendEventToContentScript<
      ISignMessageRequestPayload,
      IRuntimeSignMessageMessage | IRuntimeErrorResponse
    >(XBULL_SIGN_MESSAGE, dispatchEventParams);

    const { detail } = response.data;

    if (!detail || detail.error) {
      return {
        error: {
          code: detail?.code || -1,
          message: detail?.errorMessage || 'Unexpected error',
        }
      };
    }

    return {
      signedMessage: detail.payload.signedMessage,
      signerAddress: detail.payload.signerAddress,
    };
  }

}

(window as any).xBullSDK = new Sdk();

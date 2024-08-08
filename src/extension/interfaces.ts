import { Networks } from 'stellar-sdk';


export const XBULL_CONNECT = 'XBULL_CONNECT';
export const XBULL_CONNECT_BACKGROUND = 'XBULL_CONNECT_BACKGROUND';

export const XBULL_GET_PUBLIC_KEY = 'XBULL_GET_PUBLIC_KEY';
export const XBULL_GET_PUBLIC_KEY_BACKGROUND = 'XBULL_GET_PUBLIC_KEY_BACKGROUND';

export const XBULL_SIGN_XDR = 'XBULL_SIGN_XDR';
export const XBULL_SIGN_XDR_BACKGROUND = 'XBULL_SIGN_XDR_BACKGROUND';

export const XBULL_GET_NETWORK = 'XBULL_GET_NETWORK';
export const XBULL_GET_NETWORK_BACKGROUND = 'XBULL_GET_NETWORK_BACKGROUND';

export type SdkResponse<T> = T | { error: SdkError };

interface SdkError {
  message: string;    // general description message returned to the client app
  code: number;       // unique error code
  ext?: Array<string>;  // optional extended details
}


// ----- SDK and Content script types
export type EventTypes = typeof XBULL_CONNECT
  | typeof XBULL_GET_PUBLIC_KEY
  | typeof XBULL_SIGN_XDR
  | typeof XBULL_GET_NETWORK;

/**
 * @deprecated
 */
export interface ISitePermissions {
  canRequestPublicKey: boolean;
  canRequestSign: boolean;
}

export interface IConnectRequestPayload {
  origin: string;
  host: string;
  permissions: ISitePermissions;
}

export interface IGetPublicKeyRequestPayload {
  origin: string;
  host: string;
}

export interface IGetNetworkRequestPayload {
  origin: string;
  host: string;
}

export interface ISignXDRRequestPayload {
  origin: string;
  host: string;
  xdr: string;
  xdrType: 'Transaction' | 'AuthEntry';
  publicKey?: string;
  network?: Networks;
}
// ----- SDK and Content script types END

// ----- Background and Content script types
export type BackgroundEventTypes = typeof XBULL_CONNECT_BACKGROUND
  | typeof XBULL_GET_PUBLIC_KEY_BACKGROUND
  | typeof XBULL_SIGN_XDR_BACKGROUND
  | typeof XBULL_GET_NETWORK_BACKGROUND;

export interface IRuntimeConnectMessage {
  event: typeof XBULL_CONNECT_BACKGROUND;
  payload: IConnectRequestPayload;
}

export interface IRuntimeGetPublicKeyMessage {
  event: typeof XBULL_GET_PUBLIC_KEY_BACKGROUND;
  payload: IGetPublicKeyRequestPayload;
}

export interface IRuntimeSignXDRMessage {
  event: typeof XBULL_SIGN_XDR_BACKGROUND;
  payload: ISignXDRRequestPayload;
}

export interface IRuntimeGetNetworkMessage {
  event: typeof XBULL_GET_NETWORK_BACKGROUND;
  payload: IGetNetworkRequestPayload;
}

export type RuntimeMessage = IRuntimeConnectMessage
  | IRuntimeGetPublicKeyMessage
  | IRuntimeSignXDRMessage
  | IRuntimeGetNetworkMessage;

export interface IRuntimeConnectResponse {
  error: false;
  payload: ISitePermissions;
}

export interface IRuntimeGetPublicKeyResponse {
  error: false;
  payload: string;
}

export interface IRuntimeSignXDRResponse {
  error: false;
  payload: {
    signedXdr: string;
    signerAddress: string;
  };
}

export interface IRuntimeGetNetworkResponse {
  error: false;
  payload: {
    network: string,
    networkPassphrase: string
  };
}

export interface IRuntimeErrorResponse {
  error: true;
  errorMessage: string;
  code?: number;
}

export type RuntimeResponse = IRuntimeConnectResponse
  | IRuntimeGetPublicKeyResponse
  | IRuntimeSignXDRResponse
  | IRuntimeErrorResponse
  | IRuntimeGetNetworkResponse;
// ----- Background and Content script types END

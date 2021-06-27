export const XBULL_CONNECT = 'XBULL_CONNECT';
export const XBULL_CONNECT_BACKGROUND = 'XBULL_CONNECT_BACKGROUND';

export const XBULL_GET_PUBLIC_KEY = 'XBULL_GET_PUBLIC_KEY';
export const XBULL_GET_PUBLIC_KEY_BACKGROUND = 'XBULL_GET_PUBLIC_KEY_BACKGROUND';


// ----- SDK and Content script types
export type EventTypes = typeof XBULL_CONNECT
  | typeof XBULL_GET_PUBLIC_KEY;

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
// ----- SDK and Content script types END

// ----- Background and Content script types
export type BackgroundEventTypes = typeof XBULL_CONNECT_BACKGROUND
  | typeof XBULL_GET_PUBLIC_KEY_BACKGROUND;

export interface IRuntimeConnectMessage {
  event: typeof XBULL_CONNECT_BACKGROUND;
  payload: IConnectRequestPayload;
}

export interface IRuntimeGetPublicKeyMessage {
  event: typeof XBULL_GET_PUBLIC_KEY_BACKGROUND;
  payload: IGetPublicKeyRequestPayload;
}

export type RuntimeMessage = IRuntimeConnectMessage
  | IRuntimeGetPublicKeyMessage;

export interface IRuntimeConnectResponse {
  error: false;
  payload: ISitePermissions;
}

export interface IRuntimeGetPublicKeyResponse {
  error: false;
  payload: string;
}

export interface IRuntimeErrorResponse {
  error: true;
  errorMessage: string;
}

export type RuntimeResponse = IRuntimeConnectResponse
  | IRuntimeGetPublicKeyResponse
  | IRuntimeErrorResponse;
// ----- Background and Content script types END

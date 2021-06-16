export const XBULL_CONNECT = 'XBULL_CONNECT';
export const XBULL_CONNECT_BACKGROUND = 'XBULL_CONNECT_BACKGROUND';


// ----- SDK and Content script types
export type EventTypes = typeof XBULL_CONNECT;

export interface ISitePermissions {
  canRequestPublicKey: boolean;
  canRequestSign: boolean;
}

export interface IConnectRequestPayload {
  origin: string;
  host: string;
  permissions: ISitePermissions;
}
// ----- SDK and Content script types END

// ----- Background and Content script types
export type BackgroundEventTypes = typeof XBULL_CONNECT_BACKGROUND;

export interface IRuntimeConnectMessage {
  event: typeof XBULL_CONNECT_BACKGROUND;
  payload: IConnectRequestPayload;
}

export type RuntimeMessage = IRuntimeConnectMessage;

export interface IRuntimeConnectResponse {
  error: false;
  payload: ISitePermissions;
}

export interface IRuntimeErrorResponse {
  error: true;
  errorMessage: string;
}

export type RuntimeResponse = IRuntimeConnectResponse | IRuntimeErrorResponse;
// ----- Background and Content script types END

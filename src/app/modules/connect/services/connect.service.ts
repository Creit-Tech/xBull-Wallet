import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConnectService {

  constructor() { }



  rejectRequest(type: EventType): void {
    opener.postMessage({
      type,
      success: false,
    }, '*');
  }
}

export interface IEventData {
  type: EventType;
  message: string; // Encrypted base64
  oneTimeCode: string; // base64
}

export enum EventType {
  XBULL_INITIAL_RESPONSE = 'XBULL_INITIAL_RESPONSE',
  XBULL_CONNECT = 'XBULL_CONNECT',
  XBULL_CONNECT_RESPONSE = 'XBULL_CONNECT_RESPONSE',
}

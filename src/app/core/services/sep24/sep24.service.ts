import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { resolve } from 'path';

@Injectable({
  providedIn: 'root'
})
export class Sep24Service {

  constructor(
    private readonly http: HttpClient,
  ) { }

  getInfo(serverUrl: string): Observable<ISep24InfoResponse> {
    const url = new URL(serverUrl);
    url.pathname = resolve(url.pathname, 'info');
    return this.http.get<ISep24InfoResponse>(url.href);
  }
}

export interface ISep24RampDetails {
  [x: string]: {
    enabled: boolean;
    min_amount?: number;
    max_amount?: number;
    fee_fixed?: number;
    fee_percent?: number;
    fee_minimum?: number;
  };
}

export interface ISep24InfoResponse {
  deposit: ISep24RampDetails;
  withdraw: ISep24RampDetails;

  fee: {
    enabled: boolean;
  };

  features: {
    account_creation: false;
    claimable_balances: false;
  };
}

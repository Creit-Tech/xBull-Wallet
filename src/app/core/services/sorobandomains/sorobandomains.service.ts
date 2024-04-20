import { Injectable } from '@angular/core';
import { SorobanDomainsSDK } from '@creit.tech/sorobandomains-sdk';
import * as SDK from 'stellar-sdk';

@Injectable({
  providedIn: 'root'
})
export class SorobandomainsService {
  public sdk: SorobanDomainsSDK = new SorobanDomainsSDK({
    contractId: 'CATRNPHYKNXAPNLHEYH55REB6YSAJLGCPA4YM6L3WUKSZOPI77M2UMKI',
    rpc: new SDK.SorobanRpc.Server('https://soroban-rpc.creit.tech'),
    defaultFee: '1000000',
    defaultTimeout: 30,
    network: SDK.Networks.PUBLIC,
    simulationAccount: 'GDTW6WIS5SKEITK6KZMJSPD7FK7Z5B7WSGYCGMQD6K4YH7RIHQYQSXJB',
    stellarSDK: SDK as any,
  });

  constructor() { }

  domainParser(domain: string): {  domain: string; subDomain?: string; } {
    if (!domain) {
      throw new Error('invalid domain');
    }

    const parts: string[] = domain.split('.');

    switch (parts.length) {
      case 1:
        return { domain: parts[0] };
      case 2:
        return { domain: parts[1], subDomain: parts[0] };

      default:
        throw new Error('invalid domain');
    }
  }
}

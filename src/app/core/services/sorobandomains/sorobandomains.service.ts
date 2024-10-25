import { parse } from 'toml';
import { Injectable } from '@angular/core';
import { DomainStorageValue, SorobanDomainsSDK, DefaultStorageKeys } from '@creit.tech/sorobandomains-sdk';
import * as SDK from '@stellar/stellar-sdk';
import { StellarToml } from '@stellar/stellar-sdk';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SorobandomainsService {
  public sdk: SorobanDomainsSDK = new SorobanDomainsSDK({
    vaultsContractId: 'CATRNPHYKNXAPNLHEYH55REB6YSAJLGCPA4YM6L3WUKSZOPI77M2UMKI',
    valuesDatabaseContractId: 'CDH2T2CBGFPFNVRWFK4XJIRP6VOWSVTSDCRBCJ2TEIO22GADQP6RG3Y6',
    rpc: new SDK.SorobanRpc.Server('https://soroban-rpc.creit.tech') as any,
    defaultFee: '1000000',
    defaultTimeout: 30,
    network: SDK.Networks.PUBLIC,
    simulationAccount: 'GDTW6WIS5SKEITK6KZMJSPD7FK7Z5B7WSGYCGMQD6K4YH7RIHQYQSXJB',
    stellarSDK: SDK as any,
  });

  constructor(
    private readonly http: HttpClient,
  ) { }

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

  async getDomainToml(domain: string): Promise<StellarToml.Api.StellarToml> {
    const domainParts = this.domainParser(domain);
    let value: DomainStorageValue;
    try {
      value = await this.sdk.getDomainData({
        node: SorobanDomainsSDK.parseDomain({ domain: domainParts.domain }),
        key: DefaultStorageKeys.TOML,
      });
    } catch (e) {
      return {};
    }
    const [ type, data ] = value;
    if (type !== 'String') return {};
    if (!data) return {};

    const fileData = await firstValueFrom(this.http.get(data, { responseType: 'text' }));
    return parse(fileData);
  }
}

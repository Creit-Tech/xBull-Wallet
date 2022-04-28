import { Injectable } from '@angular/core';
import { createHorizonApi, HorizonApisStore, IHorizonApi } from '~root/state';
import { randomBytes } from 'crypto';
import {Networks} from "stellar-base";

@Injectable({
  providedIn: 'root'
})
export class HorizonApisService {

  constructor(
    private readonly horizonApisStore: HorizonApisStore,
  ) { }

  addHorizonApi(params: Omit<IHorizonApi, '_id' | 'Server'>): void {
    const recordId = randomBytes(16).toString('hex');
    this.horizonApisStore.upsert(recordId, createHorizonApi({ _id: recordId, ...params }));
  }

  removeHorizonApi(horizonId: IHorizonApi['_id']): void {
    this.horizonApisStore.remove(horizonId);
  }

  selectHorizonApi(horizonId: IHorizonApi['_id']): void {
    this.horizonApisStore.setActive(horizonId);
  }

  setHorizonByNetwork(network: Networks): void {
    switch (network) {
      case Networks.PUBLIC:
        this.selectHorizonApi('aa604e66a74ade3ef250f904ef28c92d');
        break;

      case Networks.TESTNET:
        this.selectHorizonApi('10a05029fe79fe9df15c33ee2e2d43bb');
        break;

      default:
        throw new Error('This network does not exists in our records');
    }
  }

  userNetworkName(network: string): string {
    if (network === Networks.PUBLIC) {
      return 'Public';
    } else if (network === Networks.TESTNET) {
      return 'Testnet';
    } else {
      return network;
    }
  }
}

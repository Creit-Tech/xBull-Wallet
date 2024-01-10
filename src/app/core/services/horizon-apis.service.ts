import { Injectable } from '@angular/core';
import { createHorizonApi, HorizonApisStore, IHorizonApi } from '~root/state';
import { randomBytes } from 'crypto';
import { Networks } from 'stellar-sdk';

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
    const state = this.horizonApisStore.getValue();
    const target = Object.values(state.entities || {}).find(e => e.networkPassphrase === network);

    if (!target) {
      throw new Error('This network does not exists in our records');
    }

    this.selectHorizonApi(target._id);
  }

  userNetworkName(network: Networks): string {
    const index = Object.values(Networks).indexOf(network);
    return Object.keys(Networks)[index] || network;
  }

  addSorobanDevelopmentHorizons(): void {
    this.addHorizonApi({
      networkPassphrase: Networks.FUTURENET,
      url: 'https://horizon-futurenet.stellar.org',
      name: 'Futurenet',
      canRemove: false,
    });

    this.addHorizonApi({
      networkPassphrase: Networks.STANDALONE,
      url: 'http://localhost:8000',
      name: 'Standalone',
      canRemove: false,
    });
  }
}

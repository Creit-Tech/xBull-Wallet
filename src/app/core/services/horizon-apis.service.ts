import { Injectable } from '@angular/core';
import { createNetworkApi, HorizonApisStore, INetworkApi } from '~root/state';
import { randomBytes } from 'crypto';
import { Networks } from 'stellar-sdk';

@Injectable({
  providedIn: 'root'
})
export class HorizonApisService {

  constructor(
    private readonly horizonApisStore: HorizonApisStore,
  ) { }

  addHorizonApi(params: Omit<INetworkApi, '_id' | 'Server'>): void {
    const recordId = randomBytes(16).toString('hex');
    this.horizonApisStore.upsert(recordId, createNetworkApi({ _id: recordId, ...params }));
  }

  updateApi(network: INetworkApi): void {
    this.horizonApisStore.upsert(network._id, network);
  }

  removeHorizonApi(horizonId: INetworkApi['_id']): void {
    this.horizonApisStore.remove(horizonId);
  }

  selectHorizonApi(horizonId: INetworkApi['_id']): void {
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
}

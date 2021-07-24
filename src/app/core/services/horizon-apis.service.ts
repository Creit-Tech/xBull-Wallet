import { Injectable } from '@angular/core';
import { createHorizonApi, HorizonApisStore, IHorizonApi } from '~root/state';
import { randomBytes } from 'crypto';

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
}

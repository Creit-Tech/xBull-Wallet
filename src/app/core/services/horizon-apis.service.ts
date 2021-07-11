import { Injectable } from '@angular/core';
import { HorizonApisStore, IHorizonApi } from '~root/state';
import { randomBytes } from 'crypto';

@Injectable({
  providedIn: 'root'
})
export class HorizonApisService {

  constructor(
    private readonly horizonApisStore: HorizonApisStore,
  ) { }

  addHorizonApi(params: Omit<IHorizonApi, '_id'>): void {
    const recordId = randomBytes(16).toString('hex');
    this.horizonApisStore.upsert(recordId, params);
  }

  removeHorizonApi(horizonId: IHorizonApi['_id']): void {
    this.horizonApisStore.remove(horizonId);
  }
}

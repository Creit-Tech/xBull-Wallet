import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { HorizonApisStore, HorizonApisState } from './horizon-apis.store';

@Injectable({ providedIn: 'root' })
export class HorizonApisQuery extends QueryEntity<HorizonApisState> {

  constructor(protected store: HorizonApisStore) {
    super(store);
  }

}

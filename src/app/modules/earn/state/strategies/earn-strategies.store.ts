import { Injectable } from '@angular/core';
import { EntityState, StoreConfig } from '@datorama/akita';
import { IEarnStrategy } from './earn-strategy.model';
import { BaseEntityStore } from '~root/state/base-entity.store';

export interface EarnStrategiesState extends EntityState<IEarnStrategy> {
  UIState: {
    requestingStrategies: boolean;
    requestingStrategiesSnapshots: boolean;
  };
}

@Injectable()
@StoreConfig({
  name: 'earn-strategies',
  idKey: '_id',
  resettable: true,
})
export class EarnStrategiesStore extends BaseEntityStore<EarnStrategiesState> {

  constructor() {
    super({
      UIState: {
        requestingStrategies: false,
        requestingStrategiesSnapshots: false,
      }
    });
  }

}

import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { IAlertsLabel } from './alerts-label.model';
import { BaseEntityStore } from '~root/state/base-entity.store';

export interface AlertsLabelsState extends EntityState<IAlertsLabel> {
  UIState: {
    gettingAlertsLabelsByCreitTech: boolean;
  };
}

@Injectable({ providedIn: 'root' })
@StoreConfig({
  name: 'alerts-labels',
  idKey: '_id'
})
export class AlertsLabelsStore extends BaseEntityStore<AlertsLabelsState> {

  constructor() {
    super({
      UIState: {
        gettingAlertsLabelsByCreitTech: true,
      }
    });
  }

}

import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { AlertsLabelsStore, AlertsLabelsState } from './alerts-labels.store';
import { IWalletAsset, IWalletAssetModel } from '~root/state';
import { IAlertsLabel } from '~root/state/alerts-labels/alerts-label.model';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AlertsLabelsQuery extends QueryEntity<AlertsLabelsState> {

  constructor(protected store: AlertsLabelsStore) {
    super(store);
  }

  getLabelAlertForAsset(asset: IWalletAssetModel): IAlertsLabel | undefined {
    let alert: IAlertsLabel | undefined;
    if (!!asset.domain) {
      const domain = asset.domain.split('.').slice(-2).join('.');
      alert = this.getEntity(`domain_${domain}`);
    }

    return alert;
  }

}

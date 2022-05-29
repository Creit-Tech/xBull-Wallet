import { Injectable } from '@angular/core';
import { AlertsLabelsStore } from '~root/state/alerts-labels/alerts-labels.store';
import { Observable } from 'rxjs';
import { createAlertsLabel, IAlertsLabel } from '~root/state/alerts-labels/alerts-label.model';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { applyTransaction } from '@datorama/akita';

@Injectable({
  providedIn: 'root'
})
export class AlertsLabelsService {

  constructor(
    private readonly alertsLabelsStore: AlertsLabelsStore,
    private readonly http: HttpClient,
  ) { }

  getAlertsLabelsByCreitTech(): Observable<IAlertsLabel[]> {
    this.alertsLabelsStore.updateUIState({ gettingAlertsLabelsByCreitTech: true });
    return this.http.get<{ items: IAlertsLabel[] }>(`https://raw.githubusercontent.com/Creit-Tech/stellar-assets/main/dist/alert-labels-by-creit-tech.json`)
      .pipe(map(response => {
        const alertsLabels = response.items.map(item => createAlertsLabel(item));
        applyTransaction(() => {
          this.alertsLabelsStore.updateUIState({ gettingAlertsLabelsByCreitTech: false });
          this.alertsLabelsStore.upsertMany(alertsLabels);
        });
        return alertsLabels;
      }));
  }
}

import { AfterViewInit, Component, Input, OnInit } from '@angular/core';
import { IWalletAssetModel } from '~root/state';
import { AlertsLabelsQuery } from '~root/state/alerts-labels/alerts-labels.query';
import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { IAlertsLabel } from '~root/state/alerts-labels/alerts-label.model';

@Component({
  selector: 'app-scam-alert-icon',
  templateUrl: './scam-alert-icon.component.html',
  styleUrls: ['./scam-alert-icon.component.scss']
})
export class ScamAlertIconComponent implements OnInit, AfterViewInit {
  @Input() type: 'message' | 'icon' = 'icon';

  asset$: BehaviorSubject<IWalletAssetModel | undefined> = new BehaviorSubject<IWalletAssetModel | undefined>(undefined);
  @Input() set asset(data: IWalletAssetModel | undefined) {
    this.asset$.next(data);
  }

  alert$: Observable<IAlertsLabel | undefined> = this.asset$.asObservable()
    .pipe(map(asset => {
      if (!asset) {
        return undefined;
      }
      return this.alertsLabelsQuery.getLabelAlertForAsset(asset);
    }));

  constructor(
    private readonly alertsLabelsQuery: AlertsLabelsQuery,
  ) { }

  ngOnInit(): void {}

  ngAfterViewInit(): void {}

}

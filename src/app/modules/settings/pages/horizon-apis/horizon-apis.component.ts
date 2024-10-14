import { Component, OnDestroy, OnInit } from '@angular/core';
import { HorizonApisQuery, INetworkApi } from '~root/state';
import { ComponentCreatorService } from '~root/core/services/component-creator.service';
import { AddHorizonApiComponent } from '~root/modules/settings/components/add-horizon-api/add-horizon-api.component';
import { Subject } from 'rxjs';
import { HorizonApiDetailsComponent } from '~root/modules/settings/components/horizon-api-details/horizon-api-details.component';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-horizon-apis',
  templateUrl: './horizon-apis.component.html',
  styleUrls: ['./horizon-apis.component.scss']
})
export class HorizonApisComponent implements OnInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();
  allHorizonApis$ = this.horizonApisQuery.selectAll();

  constructor(
    private readonly horizonApisQuery: HorizonApisQuery,
    private readonly componentCreatorService: ComponentCreatorService,
    private readonly nzDrawerService: NzDrawerService,
    private readonly translateService: TranslateService,
  ) { }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  async onHorizonItemClicked(horizon: INetworkApi): Promise<void> {
    const drawerRef = this.nzDrawerService.create<HorizonApiDetailsComponent>({
      nzContent: HorizonApiDetailsComponent,
      nzContentParams: {
        horizonApi: horizon,
      },
      nzWrapClassName: 'drawer-full-w-340 ios-safe-y',
      nzTitle: this.translateService.instant('COMMON_WORDS.DETAILS'),
    });

    drawerRef.open();
  }

  async addNewHorizonApi(): Promise<void> {
    const nzRef = this.nzDrawerService.create<AddHorizonApiComponent>({
      nzContent: AddHorizonApiComponent,
      nzWrapClassName: 'drawer-full-w-340 ios-safe-y',
      nzTitle: this.translateService.instant('COMMON_WORDS.ADD'),
    });

    nzRef.open();
  }

}

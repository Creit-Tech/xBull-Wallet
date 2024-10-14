import { Component, Input, OnInit } from '@angular/core';
import { HorizonApisQuery, INetworkApi } from '~root/state';
import { firstValueFrom, Observable, ReplaySubject } from 'rxjs';
import { HorizonApisService } from '~root/core/services/horizon-apis.service';
import { NzDrawerRef, NzDrawerService } from 'ng-zorro-antd/drawer';
import { AddHorizonApiComponent } from '~root/modules/settings/components/add-horizon-api/add-horizon-api.component';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-horizon-api-details',
  templateUrl: './horizon-api-details.component.html',
  styleUrls: ['./horizon-api-details.component.scss']
})
export class HorizonApiDetailsComponent implements OnInit {
  networkApi$: ReplaySubject<INetworkApi> = new ReplaySubject<INetworkApi>(0);
  @Input() set horizonApi(data: INetworkApi) {
    this.networkApi$.next(data);
  }

  selectedHorizonApi$: Observable<INetworkApi> = this.horizonApisQuery.getSelectedHorizonApi$;

  constructor(
    private readonly horizonApisService: HorizonApisService,
    private readonly horizonApisQuery: HorizonApisQuery,
    private readonly nzDrawerRef: NzDrawerRef,
    private readonly nzDrawerService: NzDrawerService,
    private readonly translateService: TranslateService,
  ) { }

  ngOnInit(): void {
  }

  async onRemove(): Promise<void> {
    const horizonApi = await firstValueFrom(this.networkApi$);

    this.horizonApisService.removeHorizonApi(horizonApi._id);
    this.nzDrawerRef.close();
  }

  async update() {
    const networkApi = await firstValueFrom(this.networkApi$);
    const nzRef = this.nzDrawerService.create<AddHorizonApiComponent>({
      nzContent: AddHorizonApiComponent,
      nzWrapClassName: 'drawer-full-w-340 ios-safe-y',
      nzTitle: this.translateService.instant('COMMON_WORDS.UPDATE'),
      nzData: { networkApi }
    });

    nzRef.open();
    this.nzDrawerRef.close();
  }

}

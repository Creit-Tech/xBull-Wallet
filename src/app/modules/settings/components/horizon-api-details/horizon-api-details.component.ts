import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { HorizonApisQuery, IHorizonApi } from '~root/state';
import { Observable, ReplaySubject } from 'rxjs';
import { pluck, take } from 'rxjs/operators';
import { HorizonApisService } from '~root/core/services/horizon-apis.service';
import { NzDrawerRef } from 'ng-zorro-antd/drawer';

@Component({
  selector: 'app-horizon-api-details',
  templateUrl: './horizon-api-details.component.html',
  styleUrls: ['./horizon-api-details.component.scss']
})
export class HorizonApiDetailsComponent implements OnInit {
  horizonApi$: ReplaySubject<IHorizonApi> = new ReplaySubject<IHorizonApi>();
  @Input() set horizonApi(data: IHorizonApi) {
    this.horizonApi$.next(data);
  }

  selectedHorizonApi$: Observable<IHorizonApi> = this.horizonApisQuery.getSelectedHorizonApi$;

  constructor(
    private readonly horizonApisService: HorizonApisService,
    private readonly horizonApisQuery: HorizonApisQuery,
    private readonly nzDrawerRef: NzDrawerRef,
  ) { }

  ngOnInit(): void {
  }

  async onRemove(): Promise<void> {
    const horizonApiId = await this.horizonApi$
      .asObservable()
      .pipe(take(1))
      .pipe(pluck('_id'))
      .toPromise();

    this.horizonApisService.removeHorizonApi(horizonApiId);
    this.nzDrawerRef.close();
  }

}

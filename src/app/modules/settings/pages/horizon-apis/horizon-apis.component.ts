import { Component, OnDestroy, OnInit } from '@angular/core';
import { HorizonApisQuery, IHorizonApi } from '~root/state';
import { ComponentCreatorService } from '~root/core/services/component-creator.service';
import { AddHorizonApiComponent } from '~root/modules/settings/components/add-horizon-api/add-horizon-api.component';
import { take, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { HorizonApiDetailsComponent } from '~root/modules/settings/components/horizon-api-details/horizon-api-details.component';

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
  ) { }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  async onHorizonItemClicked(horizon: IHorizonApi): Promise<void> {
    const ref = await this.componentCreatorService.createOnBody<HorizonApiDetailsComponent>(HorizonApiDetailsComponent);

    ref.component.instance.horizonApi = horizon;

    ref.component.instance.close
      .asObservable()
      .pipe(take(1))
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(() => {
        ref.component.instance.onClose()
          .then(() => ref.close());
      });

    ref.open();
  }

  async addNewHorizonApi(): Promise<void> {
    const ref = await this.componentCreatorService.createOnBody<AddHorizonApiComponent>(AddHorizonApiComponent);

    ref.component.instance.close
      .asObservable()
      .pipe(take(1))
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(() => {
        ref.component.instance.onClose()
          .then(() => ref.close());
      });

    ref.open();
  }

}

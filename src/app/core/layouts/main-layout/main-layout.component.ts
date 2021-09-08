import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { pluck, take, takeUntil } from 'rxjs/operators';
import { SettingsQuery } from '~root/state/settings.query';
import { HorizonApisQuery, WalletsAccountsQuery } from '~root/state';
import { ComponentCreatorService } from '~root/core/services/component-creator.service';
import { SelectAccountComponent } from '~root/core/layouts/main-layout/components/select-account/select-account.component';
import { Subject } from 'rxjs';
import { SelectHorizonApiComponent } from '~root/core/layouts/main-layout/components/select-horizon-api/select-horizon-api.component';
import { GlobalsService } from '~root/lib/globals/globals.service';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();
  activeIcon$: Observable<'wallet' | 'trade' | 'settings' | 'lab'> = this.route.data.pipe(pluck('activeIcon'));

  advanceMode$ = this.settingsQuery.advanceMode$;

  activeAccount$ = this.walletsAccountsQuery.getSelectedAccount$;
  activeHorizonApi$ = this.horizonApisQuery.getSelectedHorizonApi$;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly settingsQuery: SettingsQuery,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly horizonApisQuery: HorizonApisQuery,
    private readonly componentCreatorService: ComponentCreatorService,
    private readonly globalsService: GlobalsService,
  ) { }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  async onAccountClicked(): Promise<void> {
    const ref = await this.componentCreatorService.createOnBody<SelectAccountComponent>(SelectAccountComponent);

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

  async onHorizonApiClicked(): Promise<void> {
    const ref = await this.componentCreatorService.createOnBody<SelectHorizonApiComponent>(SelectHorizonApiComponent);

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

  onWin() {
    this.globalsService.openWindowMode();
  }

}

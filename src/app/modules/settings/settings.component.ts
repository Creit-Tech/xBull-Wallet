import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { SettingsQuery } from '~root/state/settings.query';
import { SettingsService } from '~root/core/settings/services/settings.service';
import { CheckboxControlValueAccessor, FormControl } from '@angular/forms';
import { takeUntil } from 'rxjs/operators';
import { DefaultFeeFormComponent } from '~root/modules/settings/components/default-fee-form/default-fee-form.component';
import { HorizonApisQuery, WalletsAccountsQuery, WalletsQuery } from '~root/state';
import { NzDrawerService } from 'ng-zorro-antd/drawer';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();
  advanceMode$ = this.settingsQuery.advanceMode$;
  defaultFee$ = this.settingsQuery.defaultFee$;

  advanceModeControl: FormControl = new FormControl(false);

  selectedWallet$ = this.walletsQuery.getSelectedWallet$;
  selectedAccount$ = this.walletsAccountsQuery.getSelectedAccount$;

  selectedHorizonApi$ = this.horizonApisQuery.getSelectedHorizonApi$;

  constructor(
    private readonly settingsQuery: SettingsQuery,
    private readonly settingsService: SettingsService,
    private readonly walletsQuery: WalletsQuery,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly horizonApisQuery: HorizonApisQuery,
    private readonly nzDrawerService: NzDrawerService,
  ) { }

  advanceModeStateSubscription: Subscription = this.advanceMode$
    .pipe(takeUntil(this.componentDestroyed$))
    .subscribe(mode => {
      this.advanceModeControl.patchValue(mode, {
        emitEvent: false,
      });
    });

  advanceModeControlUpdateSubscription: Subscription = this.advanceModeControl.valueChanges
    .pipe(takeUntil(this.componentDestroyed$))
    .subscribe(value => {
      this.settingsService.setAdvanceModeStatus(value);
    });

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  async conDefaultFeeClicked(): Promise<void> {
    const drawerRef = this.nzDrawerService.create<DefaultFeeFormComponent>({
      nzContent: DefaultFeeFormComponent,
      nzPlacement: 'bottom',
      nzHeight: 'auto',
      nzTitle: ''
    });

    drawerRef.open();
  }

}

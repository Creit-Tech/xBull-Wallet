import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Observable, of, Subject, Subscription } from 'rxjs';
import { SettingsQuery } from '~root/state/settings.query';
import { SettingsService } from '~root/core/settings/services/settings.service';
import { CheckboxControlValueAccessor, FormControl } from '@angular/forms';
import { switchMap, take, takeUntil } from 'rxjs/operators';
import { DefaultFeeFormComponent } from '~root/modules/settings/components/default-fee-form/default-fee-form.component';
import {
  HorizonApisQuery,
  IWalletAssetModel,
  WalletsAccountsQuery,
  WalletsAssetsQuery,
  WalletsQuery
} from '~root/state';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import { AssetSearcherComponent } from '~root/shared/asset-searcher/asset-searcher.component';
import { WalletsAssetsService } from '~root/core/wallets/services/wallets-assets.service';

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

  counterAssetId$ = this.settingsQuery.counterAssetId$;
  counterAsset$ = this.counterAssetId$
    .pipe(switchMap(assetId => this.walletsAssetsQuery.selectEntity(assetId)));

  myAssets$: Observable<IWalletAssetModel[]> = this.walletsAssetsQuery.selectedAccountAssets$;

  constructor(
    private readonly settingsQuery: SettingsQuery,
    private readonly settingsService: SettingsService,
    private readonly walletsQuery: WalletsQuery,
    private readonly walletsAssetsQuery: WalletsAssetsQuery,
    private readonly horizonApisQuery: HorizonApisQuery,
    private readonly nzDrawerService: NzDrawerService,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
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
      nzWrapClassName: 'drawer-full-w-320',
      nzTitle: 'Set default fee'
    });

    drawerRef.open();
  }

  async setCounterAsset(): Promise<void> {
    this.nzDrawerService.create<AssetSearcherComponent>({
      nzContent: AssetSearcherComponent,
      nzPlacement: 'bottom',
      nzTitle: 'Select Asset',
      nzHeight: '100%',
      nzCloseOnNavigation: true,
      nzContentParams: {
        defaultAssets: await this.myAssets$.pipe(take(1)).toPromise(),
        disableCustomAsset: true,
        assetSelectedFunc: asset => {
          this.settingsService.setCounterAsset(asset._id);
        },
      }
    });
  }

}

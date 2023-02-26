import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, of, Subject, Subscription } from 'rxjs';
import { SettingsQuery } from '~root/state/settings.query';
import { SettingsService } from '~root/core/settings/services/settings.service';
import { FormControl, UntypedFormControl, Validators } from '@angular/forms';
import { switchMap, take, takeUntil } from 'rxjs/operators';
import { DefaultFeeFormComponent } from '~root/modules/settings/components/default-fee-form/default-fee-form.component';
import {
  HorizonApisQuery,
  IWalletAssetModel, SettingsStore,
  WalletsAccountsQuery,
  WalletsAssetsQuery,
  WalletsQuery
} from '~root/state';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import { AssetSearcherComponent } from '~root/shared/asset-searcher/asset-searcher.component';
import { TranslateService } from '@ngx-translate/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { WalletsAccountsService } from '~root/core/wallets/services/wallets-accounts.service';
import { WalletsService } from '~root/core/wallets/services/wallets.service';
import { applyTransaction } from '@datorama/akita';
import { HorizonApisService } from '~root/core/services/horizon-apis.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();
  defaultFee$ = this.settingsQuery.defaultFee$;

  enableSorobanDevelopment$ = this.settingsQuery.enableSorobanDevelopment$;
  allowSorobanSigning$ = this.settingsQuery.allowSorobanSigning$;
  allowSorobanContractsControl: FormControl<boolean | null> = new FormControl<boolean | null>(false);

  advanceMode$ = this.settingsQuery.advanceMode$;
  advanceModeControl: UntypedFormControl = new UntypedFormControl(false);

  selectedWallet$ = this.walletsQuery.getSelectedWallet$;
  selectedAccount$ = this.walletsAccountsQuery.getSelectedAccount$;

  selectedHorizonApi$ = this.horizonApisQuery.getSelectedHorizonApi$;

  counterAssetId$ = this.settingsQuery.counterAssetId$;
  counterAsset$ = this.counterAssetId$
    .pipe(switchMap(assetId => this.walletsAssetsQuery.selectEntity(assetId)))
    .pipe(switchMap((entity) => {
      if (!!entity) {
        return of(entity);
      } else {
        this.settingsService.setCounterAsset('native');
        return of(undefined);
      }
    }));

  myAssets$: Observable<IWalletAssetModel[]> = this.walletsAssetsQuery.selectedAccountAssets$;

  languageSelectControl: UntypedFormControl = new UntypedFormControl('', [Validators.required]);

  constructor(
    private readonly settingsQuery: SettingsQuery,
    private readonly settingsService: SettingsService,
    private readonly settingsStore: SettingsStore,
    private readonly walletsQuery: WalletsQuery,
    private readonly walletsAssetsQuery: WalletsAssetsQuery,
    private readonly horizonApisQuery: HorizonApisQuery,
    private readonly horizonApisService: HorizonApisService,
    private readonly nzDrawerService: NzDrawerService,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly translateService: TranslateService,
    private readonly nzModalService: NzModalService,
    private readonly walletsService: WalletsService,
  ) { }

  allowSorobanSigningSubscription: Subscription = this.allowSorobanSigning$
    .pipe(takeUntil(this.componentDestroyed$))
    .subscribe(mode => {
      this.allowSorobanContractsControl.patchValue(mode, {
        emitEvent: false,
      });
    });

  allowSorobanSigningUpdateSubscription: Subscription = this.allowSorobanContractsControl.valueChanges
    .pipe(takeUntil(this.componentDestroyed$))
    .subscribe(value => {
      if (value !== null) {
        this.settingsStore.updateState({ allowSorobanSigning: value });
      }
    });

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

  setLanguageSubscription: Subscription = this.languageSelectControl.valueChanges
    .pipe(takeUntil(this.componentDestroyed$))
    .subscribe(value => {
      this.settingsService.setSelectedLanguage(value);
    });

  ngOnInit(): void {
    this.settingsQuery.selectedLanguage$
      .pipe(take(1))
      .subscribe(language => {
        this.languageSelectControl.setValue(language, {
          emitEvent: false
        });
      });
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  async conDefaultFeeClicked(): Promise<void> {
    const drawerRef = this.nzDrawerService.create<DefaultFeeFormComponent>({
      nzContent: DefaultFeeFormComponent,
      nzWrapClassName: 'drawer-full-w-320 ios-safe-y',
      nzTitle: this.translateService.instant('SETTINGS.SETTINGS_DASHBOARD.SET_DEFAULT_FEE_TITLE')
    });

    drawerRef.open();
  }

  async setCounterAsset(): Promise<void> {
    this.nzDrawerService.create<AssetSearcherComponent>({
      nzContent: AssetSearcherComponent,
      nzPlacement: 'bottom',
      nzTitle: this.translateService.instant('SETTINGS.SETTINGS_DASHBOARD.SELECT_ASSET_TITLE'),
      nzHeight: '100%',
      nzWrapClassName: 'ios-safe-y',
      nzCloseOnNavigation: true,
      nzContentParams: {
        defaultAssets: await this.myAssets$.pipe(take(1)).toPromise(),
        disableCustomAsset: true,
        disableCuratedAssetByCreitTech: true,
        assetSelectedFunc: asset => {
          this.settingsService.setCounterAsset(asset._id);
        },
      }
    });
  }

  async enableSorobanDevelopment(): Promise<void> {
    const isEnabled = await this.enableSorobanDevelopment$.pipe(take(1)).toPromise();

    if (isEnabled) {
      return;
    }

    await this.nzModalService.create({
      nzContent: `Both Soroban and this feature are still in early development, you should create a backup of your wallet by going to "Settings > Import & Backup > Export file" before enabling Soroban Development.<br/><br/>This mode can not be reverted.`,
      nzTitle: 'Enable Soroban Development',
      nzOnOk: () => {
        applyTransaction(() => {
          this.walletsService.addMissingAccountsForSoroban();
          this.horizonApisService.addSorobanDevelopmentHorizons();
          this.settingsStore.updateState({ enableSorobanDevelopment: true });
        });
      }
    });


  }

}

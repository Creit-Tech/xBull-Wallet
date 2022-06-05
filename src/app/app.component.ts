import {
  Component,
  Inject,
  NgZone,
  OnInit,
  Renderer2
} from '@angular/core';
import { WalletsAccountsService } from '~root/core/wallets/services/wallets-accounts.service';
import {
  HorizonApisQuery,
  SettingsQuery,
  WalletsAccountsQuery,
  WalletsAssetsQuery,
  WalletsOperationsQuery
} from '~root/state';
import { combineLatest, Subscription, timer } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  distinctUntilKeyChanged,
  filter,
  switchMap,
  take,
  takeUntil
} from 'rxjs/operators';
import { selectPersistStateInit, snapshotManager } from '@datorama/akita';
import { ActivatedRoute } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { SettingsService } from '~root/core/settings/services/settings.service';
import { GlobalsService } from '~root/lib/globals/globals.service';
import { ENV, environment } from '~env';
import { TranslateService } from '@ngx-translate/core';
import { AlertsLabelsService } from '~root/core/services/alerts-labels/alerts-labels.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  backgroundImg$ = this.settingsQuery.backgroundImg$;
  backgroundCover$ = this.settingsQuery.backgroundCover$;

  platform = this.env.platform;

  broadcastStorageUpdate?: BroadcastChannel;

  constructor(
    @Inject(ENV)
    private readonly env: typeof environment,
    private readonly settingsService: SettingsService,
    private readonly settingsQuery: SettingsQuery,
    private readonly walletsAccountsService: WalletsAccountsService,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly walletsOperationsQuery: WalletsOperationsQuery,
    private readonly alertsLabelsService: AlertsLabelsService,
    private readonly horizonApisQuery: HorizonApisQuery,
    private readonly route: ActivatedRoute,
    @Inject(DOCUMENT)
    private readonly document: Document,
    private readonly renderer2: Renderer2,
    private readonly globalsService: GlobalsService,
    private readonly ngZone: NgZone,
    private readonly translateService: TranslateService,
  ) { }

  updateAlertsLabelsSuscription: Subscription = timer(0, 15000)
    .pipe(switchMap(_ => this.alertsLabelsService.getAlertsLabelsByCreitTech()))
    .subscribe();

  accountWithHorizonQuery$ = selectPersistStateInit()
    .pipe(switchMap(() => {
      const selectedAccount$ = this.walletsAccountsQuery.getSelectedAccount$
        .pipe(filter(account => !!account))
        .pipe(distinctUntilKeyChanged('_id'));

      const selectedHorizonApi$ = this.horizonApisQuery.getSelectedHorizonApi$
        .pipe(filter(horizon => !!horizon))
        .pipe(distinctUntilKeyChanged('_id'));

      return combineLatest([
        selectedAccount$,
        selectedHorizonApi$
      ]);
    }));

  createWalletsOperationsQuery: Subscription = this.accountWithHorizonQuery$
    .subscribe(([account, horizonApi]) => {
      this.walletsAccountsService.createOperationsStream({
        account,
        order: 'asc',
        cursor: 'now',
        horizonApi
      });
    });

  createWalletsAccountsQuery: Subscription = this.accountWithHorizonQuery$
    .pipe(debounceTime(100))
    .subscribe(([account, horizonApi]) => {
      this.walletsAccountsService.createAccountStream({ account, horizonApi });
    });

  ngOnInit(): void {
    this.activateWindowMode();

    // Keep tabs in sync when not using mobile app
    try {
      if (this.env.platform !== 'mobile') {
        if (!this.broadcastStorageUpdate) {
          this.broadcastStorageUpdate = new BroadcastChannel('xBull-storage-update-broadcast');
        }

        this.broadcastStorageUpdate.onmessage = ev => {
          this.ngZone.run(() => {
            if (ev.data) {
              snapshotManager.setStoresSnapshot(ev.data, { skipStorageUpdate: true });
            }
          });
        };
      }
    } catch (e) {
      console.warn('Broadcast of current storage state was not possible');
      console.error(e);
    }

    this.setTranslation();
  }

  activateWindowMode(): void {
    const isPopup = window.opener && window.opener !== window && !window.menubar.visible;
    if (!isPopup) {
      this.renderer2.removeClass(this.document.body, 'popup-mode');
      this.renderer2.addClass(this.document.body, 'window-mode');
      this.settingsService.turnOnWindowsMode();
    }
  }

  async setTranslation(): Promise<void> {
    this.translateService.setDefaultLang('en');

    const selectedLanguage = await selectPersistStateInit()
      .pipe(switchMap(_ => this.settingsQuery.selectedLanguage$))
      .pipe(take(1))
      .toPromise();

    if (!selectedLanguage) {
      const langToUse = this.translateService
        .getLangs()
        .find(language => language === this.translateService.getBrowserLang());

      this.settingsService.setSelectedLanguage(langToUse || 'en');
    } else {
      this.settingsService.setSelectedLanguage(selectedLanguage);
    }
  }

}

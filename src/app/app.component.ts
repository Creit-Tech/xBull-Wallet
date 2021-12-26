import {AfterViewInit, Component, HostListener, Inject, OnInit, Renderer2} from '@angular/core';
import { WalletsAccountsService } from '~root/core/wallets/services/wallets-accounts.service';
import { HorizonApisQuery, SettingsQuery, WalletsAccountsQuery, WalletsOperationsQuery } from '~root/state';
import { combineLatest, forkJoin, of, pipe, Subscription } from 'rxjs';
import { debounceTime, distinctUntilKeyChanged, filter, skip, switchMap, take, tap, withLatestFrom } from 'rxjs/operators';
import { Order, selectPersistStateInit } from '@datorama/akita';
import { ActivatedRoute } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { SettingsService } from '~root/core/settings/services/settings.service';
import { GlobalsService } from '~root/lib/globals/globals.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  backgroundImg$ = this.settingsQuery.backgroundImg$;
  backgroundCover$ = this.settingsQuery.backgroundCover$;

  constructor(
    private readonly settingsService: SettingsService,
    private readonly settingsQuery: SettingsQuery,
    private readonly walletsAccountsService: WalletsAccountsService,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly walletsOperationsQuery: WalletsOperationsQuery,
    private readonly horizonApisQuery: HorizonApisQuery,
    private readonly route: ActivatedRoute,
    @Inject(DOCUMENT)
    private readonly document: Document,
    private readonly renderer2: Renderer2,
    private readonly globalsService: GlobalsService,
  ) { }


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
    .pipe(switchMap(([account, horizonApi]) => {
      return combineLatest([
        of(account),
        of(horizonApi),
        this.walletsOperationsQuery.selectAll({
          filterBy: entity => entity.ownerAccount === account._id,
          sortBy: (entityA, entityB) => entityA.createdAt - entityB.createdAt,
        }).pipe(take(1))
      ]);
    }))
    .subscribe(([account, horizonApi, operations]) => {
      const lastValue = operations[operations.length - 1];
      this.walletsAccountsService.createOperationsStream({
        account,
        order: 'asc',
        cursor: lastValue?.pagingToken,
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
  }

  activateWindowMode(): void {
    const isPopup = window.opener && window.opener !== window && !window.menubar.visible;
    if (!isPopup) {
      this.renderer2.removeClass(this.document.body, 'popup-mode');
      this.renderer2.addClass(this.document.body, 'window-mode');
      this.settingsService.turnOnWindowsMode();
    }
  }

}

import { Component, OnDestroy, OnInit } from '@angular/core';
import { ISiteConnection, SitesConnectionsQuery } from '~root/state';
import { ConnectedSiteDetailsComponent } from '~root/modules/settings/components/connected-site-details/connected-site-details.component';
import { Observable, Subject } from 'rxjs';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-sites-connected',
  templateUrl: './sites-connected.component.html',
  styleUrls: ['./sites-connected.component.scss']
})
export class SitesConnectedComponent implements OnInit, OnDestroy {
  componentDestroyed$: Subject<void> = new Subject<void>();
  sitesConnected$: Observable<ISiteConnection[]> = this.sitesConnectionsQuery.selectAll();

  constructor(
    private readonly sitesConnectionsQuery: SitesConnectionsQuery,
    private nzDrawerService: NzDrawerService,
    private readonly translateService: TranslateService,
  ) { }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  async onSiteConnected(siteConnected: ISiteConnection): Promise<void> {
    const drawerRef = await this.nzDrawerService.create<ConnectedSiteDetailsComponent>({
      nzContent: ConnectedSiteDetailsComponent,
      nzContentParams: {
        connectedSite: siteConnected
      },
      nzTitle: this.translateService.instant('SETTINGS.SITES_CONNECTED.SELECT_SITE_TITLE'),
      nzWrapClassName: 'drawer-full-w-340 ios-safe-y',
    });

    drawerRef.open();
  }

}

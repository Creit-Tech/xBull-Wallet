import { Component, OnDestroy, OnInit } from '@angular/core';
import { ISiteConnection, SitesConnectionsQuery } from '~root/state';
import { ComponentCreatorService } from '~root/core/services/component-creator.service';
import { ConnectedSiteDetailsComponent } from '~root/modules/settings/components/connected-site-details/connected-site-details.component';
import { take, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

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
    private readonly componentCreatorService: ComponentCreatorService,
  ) { }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  async onSiteConnected(siteConnected: ISiteConnection): Promise<void> {
    const ref = await this.componentCreatorService.createOnBody<ConnectedSiteDetailsComponent>(ConnectedSiteDetailsComponent);
    ref.component.instance.connectedSite = siteConnected;

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

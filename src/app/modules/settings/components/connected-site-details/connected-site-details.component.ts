import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { firstValueFrom, ReplaySubject, Subject } from 'rxjs';
import { ISiteConnection } from '~root/state';
import { take } from 'rxjs/operators';
import { SitesConnectionsService } from '~root/core/sites-connections/sites-connections.service';
import { NzDrawerRef } from 'ng-zorro-antd/drawer';

@Component({
  selector: 'app-connected-site-details',
  templateUrl: './connected-site-details.component.html',
  styleUrls: ['./connected-site-details.component.scss']
})
export class ConnectedSiteDetailsComponent {
  componentDestroyed$: Subject<void> = new Subject<void>();

  connectedSite$: ReplaySubject<ISiteConnection> = new ReplaySubject<ISiteConnection>();
  @Input() set connectedSite(data: ISiteConnection) {
    this.connectedSite$.next(data);
  }

  constructor(
    private readonly sitesConnectionsService: SitesConnectionsService,
    private readonly nzDrawerRef: NzDrawerRef,
  ) { }

  async removeSiteRecords(): Promise<void> {
    const records = await firstValueFrom(this.connectedSite$);

    this.sitesConnectionsService.removeSiteConnection(records._id);
    this.nzDrawerRef.close();
  }

}

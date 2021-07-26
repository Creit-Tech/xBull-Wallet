import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ReplaySubject, Subject } from 'rxjs';
import { ISiteConnection } from '~root/state';
import { take } from 'rxjs/operators';
import { SitesConnectionsService } from '~root/core/sites-connections/sites-connections.service';

@Component({
  selector: 'app-connected-site-details',
  templateUrl: './connected-site-details.component.html',
  styleUrls: ['./connected-site-details.component.scss']
})
export class ConnectedSiteDetailsComponent implements AfterViewInit {
  componentDestroyed$: Subject<void> = new Subject<void>();

  connectedSite$: ReplaySubject<ISiteConnection> = new ReplaySubject<ISiteConnection>();
  @Input() set connectedSite(data: ISiteConnection) {
    this.connectedSite$.next(data);
  }

  showModal = false;
  @Output() close: EventEmitter<void> = new EventEmitter<void>();

  constructor(
    private readonly sitesConnectionsService: SitesConnectionsService,
  ) { }

  async ngAfterViewInit(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100)); // hack because for some reason Angular is not working as we want
    this.showModal = true;
  }

  async removeSiteRecords(): Promise<void> {
    const records = await this.connectedSite$
      .asObservable()
      .pipe(take(1))
      .toPromise();

    this.sitesConnectionsService.removeSiteConnection(records._id);

    this.close.emit();
  }

  async onClose(): Promise<void> {
    this.showModal = false;
    await new Promise(resolve => setTimeout(resolve, 300)); // This is to wait until the animation is done
    this.close.emit();
  }

}

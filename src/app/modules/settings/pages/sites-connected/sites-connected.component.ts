import { Component, OnInit } from '@angular/core';
import { ISiteConnection, SitesConnectionsQuery } from '~root/state';

@Component({
  selector: 'app-sites-connected',
  templateUrl: './sites-connected.component.html',
  styleUrls: ['./sites-connected.component.scss']
})
export class SitesConnectedComponent implements OnInit {
  sitesConnected$: Observable<ISiteConnection[]> = this.sitesConnectionsQuery.selectAll();

  constructor(
    private readonly sitesConnectionsQuery: SitesConnectionsQuery,
  ) { }

  ngOnInit(): void {
  }

}

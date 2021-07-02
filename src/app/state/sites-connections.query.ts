import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { SitesConnectionsStore, SitesConnectionsState } from './sites-connections.store';

@Injectable({ providedIn: 'root' })
export class SitesConnectionsQuery extends QueryEntity<SitesConnectionsState> {

  constructor(protected store: SitesConnectionsStore) {
    super(store);
  }

}

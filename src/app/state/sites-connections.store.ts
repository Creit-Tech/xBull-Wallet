import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { ISiteConnection } from './site-connection.model';

export interface SitesConnectionsState extends EntityState<ISiteConnection> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({
  name: 'sites-connections',
  idKey: '_id'
})
export class SitesConnectionsStore extends EntityStore<SitesConnectionsState> {

  constructor() {
    super();
  }

}

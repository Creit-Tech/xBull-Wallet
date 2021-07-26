import { Injectable } from '@angular/core';
import { ISiteConnection, SitesConnectionsStore } from '~root/state';

@Injectable({
  providedIn: 'root'
})
export class SitesConnectionsService {

  constructor(
    private readonly sitesConnections: SitesConnectionsStore,
  ) { }

  saveSiteConnection(data: ISiteConnection): void {
    this.sitesConnections.upsert(data._id, data);
  }

  removeSiteConnection(documentId: ISiteConnection['_id']): void {
    this.sitesConnections.remove(documentId);
  }
}

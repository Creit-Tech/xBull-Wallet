import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { CuratedAssetsStore, CuratedAssetsState } from './curated-assets.store';

@Injectable({ providedIn: 'root' })
export class CuratedAssetsQuery extends QueryEntity<CuratedAssetsState> {
  curatedByCreitTech$ = this.selectAll({ filterBy: entity => entity.type === 'by_creit_tech' });

  constructor(protected store: CuratedAssetsStore) {
    super(store);
  }

}

import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { AnchorsStore, AnchorsState } from './anchors.store';

@Injectable()
export class AnchorsQuery extends QueryEntity<AnchorsState> {

  constructor(protected store: AnchorsStore) {
    super(store);
  }

}

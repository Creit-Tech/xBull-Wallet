import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { AnchorsAuthTokensStore, AnchorsAuthTokensState } from './anchors-auth-tokens.store';

@Injectable()
export class AnchorsAuthTokensQuery extends QueryEntity<AnchorsAuthTokensState> {

  constructor(protected store: AnchorsAuthTokensStore) {
    super(store);
  }

}

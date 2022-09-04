import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { IAnchorsAuthToken } from './anchors-auth-token.model';

export interface AnchorsAuthTokensState extends EntityState<IAnchorsAuthToken> {}

@Injectable()
@StoreConfig({
  name: 'anchors-auth-tokens',
  idKey: '_id',
  resettable: true
})
export class AnchorsAuthTokensStore extends EntityStore<AnchorsAuthTokensState> {

  constructor() {
    super();
  }

}

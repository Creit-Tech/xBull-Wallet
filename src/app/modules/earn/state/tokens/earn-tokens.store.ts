import { Injectable } from '@angular/core';
import { EntityState, StoreConfig } from '@datorama/akita';
import { IEarnToken } from './earn-token.model';
import { BaseEntityStore } from '~root/state/base-entity.store';

export interface EarnTokensState extends EntityState<IEarnToken> {}

@Injectable()
@StoreConfig({
  name: 'earn-tokens',
  idKey: 'walletAccountId',
  resettable: true
})
export class EarnTokensStore extends BaseEntityStore<EarnTokensState> {

  constructor() {
    super({});
  }

}

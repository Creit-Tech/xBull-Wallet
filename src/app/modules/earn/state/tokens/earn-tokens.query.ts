import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { EarnTokensStore, EarnTokensState } from './earn-tokens.store';
import { IEarnToken } from '~root/modules/earn/state/tokens/earn-token.model';
import { Observable } from 'rxjs';

@Injectable()
export class EarnTokensQuery extends QueryEntity<EarnTokensState> {

  constructor(protected store: EarnTokensStore) {
    super(store);
  }

  getAccountToken(walletAccountId: IEarnToken['walletAccountId']): Observable<IEarnToken | undefined> {
    return this.selectEntity(walletAccountId);
  }

}

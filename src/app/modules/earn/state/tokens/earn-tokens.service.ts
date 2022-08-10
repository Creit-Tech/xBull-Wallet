import { Injectable } from '@angular/core';
import { EarnTokensStore } from './earn-tokens.store';
import { IEarnToken } from '~root/modules/earn/state/tokens/earn-token.model';

@Injectable()
export class EarnTokensService {

  constructor(private earnTokensStore: EarnTokensStore) {}

  saveAuthenticationToken(tokenEntity: IEarnToken): void {
    this.earnTokensStore.upsert(tokenEntity.walletAccountId, tokenEntity);
  }

}

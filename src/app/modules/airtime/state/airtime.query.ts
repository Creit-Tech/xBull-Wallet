import { Injectable } from '@angular/core';
import { arrayFind, Query } from '@datorama/akita';
import { AirtimeStore, AirtimeState, AirtimeAccountToken } from './airtime.store';
import { IWalletsAccount } from '~root/state';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AirtimeQuery extends Query<AirtimeState> {
  gettingCountries$ = this.select(state => state.UIState.gettingCountries);
  gettingCountryOperators$ = this.select(state => state.UIState.gettingCountryOperators);
  generatingOrder$ = this.select(state => state.UIState.generatingOrder);
  confirmOrder$ = this.select(state => state.UIState.confirmOrder);

  constructor(protected store: AirtimeStore) {
    super(store);
  }

  getWalletAccountToken(walletAccountId: IWalletsAccount['_id']): Observable<AirtimeAccountToken | null> {
    return this.select(state => state.authTokens)
      .pipe(arrayFind<AirtimeAccountToken | null>(walletAccountId, 'walletAccountId'));
  }

}

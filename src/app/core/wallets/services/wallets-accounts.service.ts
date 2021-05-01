import { Injectable } from '@angular/core';
import { Server, Networks, ServerApi, NotFoundError } from 'stellar-sdk';
import { from, of, throwError } from 'rxjs';
import { createWalletsAccount, IWalletsAccount, WalletsAccountsQuery, WalletsAccountsStore, WalletsStore } from '~root/core/wallets/state';
import { catchError, map, withLatestFrom } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class WalletsAccountsService {
  // TODO: Make this optional before launching the app IE add a settings store
  get Server(): Server {
    return new Server('https://horizon-testnet.stellar.org');
  }

  constructor(
    private readonly walletsAccountsStore: WalletsAccountsStore,
    private readonly walletsAccountsQuery: WalletsAccountsQuery
  ) { }

  getAccountData(accountId: string): Observable<IWalletsAccount> {
    this.walletsAccountsStore.ui.upsert(accountId, state => ({ ...state, requesting: true }));
    const accountPromise = this.Server.accounts().accountId(accountId).call();
    const walletAccount = this.walletsAccountsQuery.selectEntity(accountId);

    return from(accountPromise)
      .pipe(catchError(error => {
        return (error instanceof NotFoundError)
          ? of(undefined)
          : throwError(error);
      }))
      .pipe(withLatestFrom(walletAccount))
      .pipe(map(([accountRecord, entity]) => {
        this.walletsAccountsStore.ui.upsert(accountId, state => ({ ...state, requesting: false }));
        if (!entity) {
          throw new Error('This account does not exists in our wallet');
        }

        this.walletsAccountsStore.upsert(accountId, createWalletsAccount({
          ...entity,
          isCreated: !!accountRecord,
          accountRecord
        }));

        return entity;
      }));
  }
}

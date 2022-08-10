import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { selectPersistStateInit } from '@datorama/akita';
import { switchMap, take } from 'rxjs/operators';
import { EarnTokensQuery } from '~root/modules/earn/state/tokens/earn-tokens.query';
import { WalletsAccountsQuery } from '~root/state';

@Injectable()
export class EarnAuthTokenInterceptor implements HttpInterceptor {

  constructor(
    private readonly earnTokensQuery: EarnTokensQuery,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return selectPersistStateInit()
      .pipe(switchMap(_ => {
        return this.walletsAccountsQuery.getSelectedAccount$.pipe(take(1));
      }))
      .pipe(switchMap((selectedAccount) => {
        return this.earnTokensQuery.getAccountToken(selectedAccount._id);
      }))
      .pipe(switchMap(entity => {
        if (!!entity) {
          const clone = request.clone({
            setHeaders: {
              authorization: `Bearer ${entity.token}`
            }
          });
          return next.handle(clone);
        }

        return next.handle(request);
      }));
  }
}

import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor, HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap, take, tap } from 'rxjs/operators';
import { AnchorsAuthTokensQuery } from '~root/modules/anchors/state/anchors-auth-tokens.query';
import { AnchorsAuthTokensStore } from '~root/modules/anchors/state/anchors-auth-tokens.store';

@Injectable()
export class AnchorsInvalidAuthTokenInterceptor implements HttpInterceptor {

  constructor(
    private readonly anchorsAuthTokensStore: AnchorsAuthTokensStore,
    private readonly anchorsAuthTokensQuery: AnchorsAuthTokensQuery,
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request)
      .pipe(catchError((err: any | HttpErrorResponse) => {
        if (err instanceof HttpErrorResponse) {
          if (err.status === 403) { // 403 is only returned when token is not valid anymore
            console.log({err: err.status});
            return this.removeAuthToken(request)
              .pipe(switchMap(() => throwError(err)));
          }
        }

        return throwError(err);
      }));
  }

  removeAuthToken(request: HttpRequest<unknown>): Observable<any> {
    return this.anchorsAuthTokensQuery.selectAll({
      filterBy: entity =>
        entity?.token === request.headers.get('authorization')?.split(' ')[1]
    })
      .pipe(take(1))
      .pipe(tap(entities => {
        if (!!entities[0]) {
          this.anchorsAuthTokensStore.remove(entities[0]._id);
        }
      }));
  }
}

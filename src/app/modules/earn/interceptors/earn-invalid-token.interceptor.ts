import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor, HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { EarnStrategiesStore } from '~root/modules/earn/state/strategies/earn-strategies.store';
import { catchError } from 'rxjs/operators';
import { EarnVaultsStore } from '~root/modules/earn/state/vaults/earn-vaults.store';
import { applyTransaction } from '@datorama/akita';
import { EarnTokensStore } from '~root/modules/earn/state/tokens/earn-tokens.store';

@Injectable()
export class EarnInvalidTokenInterceptor implements HttpInterceptor {

  constructor(
    private readonly router: Router,
    private readonly earnStrategiesStore: EarnStrategiesStore,
    private readonly earnVaultsStore: EarnVaultsStore,
    private readonly earnTokensStore: EarnTokensStore,
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request)
      .pipe(catchError((err: HttpErrorResponse) => {
        if (err instanceof HttpErrorResponse) {
          if (err.status === 403) { // 403 is only returned when token is not valid anymore
            applyTransaction(() => {
              this.earnStrategiesStore.reset();
              this.earnVaultsStore.reset();
              this.earnTokensStore.reset();
            });
            this.router.navigate(['/earn/authentication']);
          }
        }

        return throwError(err);
      }));
  }
}

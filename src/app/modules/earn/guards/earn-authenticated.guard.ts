import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  CanActivateChild,
  Router,
  RouterStateSnapshot,
  UrlTree
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { selectPersistStateInit } from '@datorama/akita';
import { EarnTokensQuery } from '~root/modules/earn/state/tokens/earn-tokens.query';
import { WalletsAccountsQuery } from '~root/state';

@Injectable()
export class EarnAuthenticatedGuard implements CanActivate, CanActivateChild {
  constructor(
    private readonly earnTokensQuery: EarnTokensQuery,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly router: Router,
  ) {}

  guardLogic(): Observable<boolean> {
    return selectPersistStateInit()
      .pipe(switchMap(_ => {
        return this.walletsAccountsQuery.getSelectedAccount$.pipe(take(1));
      }))
      .pipe(switchMap((selectedAccount) => {
        return this.earnTokensQuery.getAccountToken(selectedAccount._id);
      }))
      .pipe(switchMap(token =>
        !!token
          ? of(true)
          : this.router.navigate(['/earn', 'authentication'])
            .then(() => false)
      ));
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.guardLogic();
  }
  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.guardLogic();
  }

}

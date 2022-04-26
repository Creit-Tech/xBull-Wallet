import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree
} from '@angular/router';
import { forkJoin, Observable } from 'rxjs';
import { WalletsAccountsQuery, WalletsQuery } from '~root/state';
import { selectPersistStateInit } from '@datorama/akita';
import { map, switchMap, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CanAccessConnectGuard implements CanActivate {

  constructor(
    private readonly walletsQuery: WalletsQuery,
    private readonly walletsAccountsQuery: WalletsAccountsQuery,
    private readonly router: Router,
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return selectPersistStateInit()
      .pipe(switchMap(() => {
        return forkJoin([
          this.walletsQuery.selectAll().pipe(take(1)),
          this.walletsAccountsQuery.selectAll().pipe(take(1))
        ])
          .pipe(map(values => {
            const canAccess = values.every(value => value.length > 0);

            if (!canAccess) {
              this.router.navigate(['/connect/no-wallet'], {
                queryParams: route.queryParams,
              });
              return false;
            } else {
              return true;
            }
          }));
      }));
  }

}

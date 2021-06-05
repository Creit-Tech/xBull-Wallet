import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router, CanActivateChild } from '@angular/router';
import { Observable, of } from 'rxjs';
import { WalletsQuery } from '~root/state';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class IsThereWalletsGuard implements CanActivate, CanActivateChild {
  constructor(
    private readonly walletsQuery: WalletsQuery,
    private readonly router: Router,
  ) { }

  guardLogic(): Observable<boolean | UrlTree> {
    return this.walletsQuery.isThereWallet$
      .pipe(switchMap(status => {
        if (!!status) {
          return of(true);
        }

        return this.router.navigate(['/create-account'])
          .then(_ => false);
      }));
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

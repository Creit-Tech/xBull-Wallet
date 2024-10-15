import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { selectPersistStateInit } from '@datorama/akita';
import { map, switchMap, take, withLatestFrom } from 'rxjs/operators';
import { WalletsQuery } from '~root/state';

@Injectable({
  providedIn: 'root'
})
export class CanCreatePasswordGuard implements CanActivate {

  constructor(
    private readonly walletsQuery: WalletsQuery,
    private readonly router: Router,
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> {
    return selectPersistStateInit()
      .pipe(switchMap(() => this.walletsQuery.passwordSet$))
      .pipe(take(1))
      .pipe(switchMap((passwordSet) => {
        if (passwordSet) {
          return this.router.navigate(['/create-account', 'confirm-phrase-password'])
            .then(() => false);
        } else {
          return of(true);
        }
      }));
  }

}

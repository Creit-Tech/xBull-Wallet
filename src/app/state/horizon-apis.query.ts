import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { HorizonApisStore, HorizonApisState } from './horizon-apis.store';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { IHorizonApi } from '~root/state/horizon-api.model';

@Injectable({ providedIn: 'root' })
export class HorizonApisQuery extends QueryEntity<HorizonApisState> {
  get getSelectedHorizonApi$(): Observable<IHorizonApi> {
    return this.selectActiveId()
      .pipe(switchMap(id => {
        if (!id) {
          return this.selectFirst() as Observable<IHorizonApi>;
        }

        return this.selectEntity(id) as Observable<IHorizonApi>;
      }));
  }

  constructor(protected store: HorizonApisStore) {
    super(store);
  }

}

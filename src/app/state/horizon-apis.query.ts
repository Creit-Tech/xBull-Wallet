import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { HorizonApisStore, HorizonApisState } from './horizon-apis.store';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { INetworkApi } from '~root/state/horizon-api.model';

@Injectable({ providedIn: 'root' })
export class HorizonApisQuery extends QueryEntity<HorizonApisState> {
  get getSelectedHorizonApi$(): Observable<INetworkApi> {
    return this.selectActiveId()
      .pipe(switchMap(id => {
        if (!id) {
          return this.selectFirst() as Observable<INetworkApi>;
        }

        return this.selectEntity(id) as Observable<INetworkApi>;
      }));
  }

  constructor(protected store: HorizonApisStore) {
    super(store);
  }

}

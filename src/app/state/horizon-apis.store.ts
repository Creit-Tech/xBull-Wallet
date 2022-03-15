import { Inject, Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { createHorizonApi, IHorizonApi } from './horizon-api.model';
import { ENV, environment } from '~env';
import { Platform } from '@ionic/angular';

export interface HorizonApisState extends EntityState<IHorizonApi> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({
  name: 'horizon-apis',
  idKey: '_id'
})
export class HorizonApisStore extends EntityStore<HorizonApisState> {

  constructor(
    @Inject(ENV)
    private readonly env: typeof environment,
    private readonly platform: Platform,
  ) {
    super();
    this.upsertMany(env.defaultApis.map(api => createHorizonApi(api)));

    const storeValue = this.getValue();
    if (!storeValue.active) {
      if (this.platform.is('ios') && env.production) {
        this.setActive('aa604e66a74ade3ef250f904ef28c92f');
      } else {
        this.setActive(env.production ? 'aa604e66a74ade3ef250f904ef28c92d' : '10a05029fe79fe9df15c33ee2e2d43bb');
      }
    }
  }

}

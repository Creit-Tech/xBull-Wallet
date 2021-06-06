import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { SettingsStore, SettingState } from './settings.store';

@Injectable({ providedIn: 'root' })
export class SettingsQuery extends Query<SettingState> {

  constructor(protected store: SettingsStore) {
    super(store);
  }

}

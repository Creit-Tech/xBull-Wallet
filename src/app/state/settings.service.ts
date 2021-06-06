import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { tap } from 'rxjs/operators';
import { SettingsStore } from './settings.store';

@Injectable({ providedIn: 'root' })
export class SettingsService {

  constructor(private settingsStore: SettingsStore, private http: HttpClient) {
  }

  get() {
    return this.http.get('').pipe(tap(entities => this.settingsStore.update(entities)));
  }

}
